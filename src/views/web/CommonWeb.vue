<template>
  <CommonPanel
    :mode="ItemTypeEnum.Web"
    :dataList="dataList"
    :displayMode="displayMode"
    v-model="visible"
    @openItem="navigateTo"
    @addWebItem="addWebItem"
    @editWebItem="editWebItem"
    @editItem="openEditWebItem"
    @deleteItem="deleteWebItem"
    ref="commonPanelRef" />
</template>

<script setup lang="ts">
import { getConfig, setConfig } from "@/utils/config.ts";
import { ref, computed } from "vue";
import { SelectItem } from "@/types/common";
import { showMessage } from "@/composables/message.ts";
import { on } from "@/utils/eventBus";
import { ipcDeleteIcon, ipcOpen } from "@/api/ipc/launch.api";
import CommonPanel from "@/components/items/CommonPanel.vue";
import { PathHandler } from "@/utils/pathHandler";
import { WebConfig } from "@/types/database";
import { DisplayModeEnum, ItemTypeEnum } from "@/types/enum";
import { ErrorHandler } from "@/utils/errorHandler";

const dataList = ref<SelectItem[]>([]);
const displayMode = ref<DisplayModeEnum>(DisplayModeEnum.List);
const commonPanelRef = ref<InstanceType<typeof CommonPanel> | null>(null);
const _visible = ref(false);

const visible = computed({
  get: () => _visible.value,
  set: (value: boolean) => {
    value && init();
    _visible.value = value;
  },
});

const init = async () => {
  try {
    const config = await getConfig<WebConfig>("webConfig");
    dataList.value = config?.dataList || [];
    if (config?.displayMode !== undefined) {
      displayMode.value = config.displayMode;
    }
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }
  on("edit-webItem", openEditWebItem);
  on("delete-webItem", deleteWebItem);
};

const openEditWebItem = async (item: SelectItem) => {
  commonPanelRef.value?.openEditModal(item);
};

const navigateTo = (item: SelectItem) => {
  let path = item.path;
  if (PathHandler.isWebUrl(path)) {
    path = PathHandler.formatUrl(path);
  }
  ipcOpen(path)
    .then(() => {
      visible.value = false;
    })
    .catch(() => {
      showMessage("打开失败!", 3000, 2);
    });
};

const addWebItem = async (item: SelectItem) => {
  item.id = Date.now();
  dataList.value.push(item);
  try {
    await setConfig("webConfig", {
      dataList: dataList.value,
      displayMode: displayMode.value,
    } as WebConfig);
  } catch (error) {
    dataList.value.pop();
    showMessage("保存失败!", 3000, 2);
  }
};

const editWebItem = async (updatedItem: SelectItem) => {
  const index = dataList.value.findIndex((item) => item.id === updatedItem.id);

  if (index !== -1) {
    dataList.value[index] = updatedItem;

    try {
      await setConfig("webConfig", {
        dataList: dataList.value,
        displayMode: displayMode.value,
      } as WebConfig);
      showMessage("更新成功!", 3000, 1);
    } catch (error) {
      showMessage("更新失败!", 3000, 2);
    }
  } else {
    showMessage("更新失败!", 3000, 2);
  }
};

const deleteWebItem = async (id: number) => {
  const index = dataList.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    const filePath = dataList.value[index].logo;
    const fileName = dataList.value[index].logo.substring(
      filePath.lastIndexOf("/") + 1,
    );

    dataList.value.splice(index, 1);
    try {
      await setConfig("webConfig", {
        dataList: dataList.value,
        displayMode: displayMode.value,
      } as WebConfig);
      ipcDeleteIcon(fileName, ItemTypeEnum.Web).catch((err) => {
        ErrorHandler.handleError(err, "图标删除失败:");
      });
      showMessage("删除成功!", 3000, 1);
    } catch (error) {
      showMessage("删除失败!", 3000, 2);
    }
  }
};

defineExpose({
  visible,
});
</script>
