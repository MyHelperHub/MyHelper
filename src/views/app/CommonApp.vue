<template>
  <CommonPanel
    :mode="ItemTypeEnum.App"
    :dataList="dataList"
    :displayMode="displayMode"
    v-model="visible"
    @openItem="openApp"
    @addAppItem="addAppItem"
    @editAppItem="editAppItem"
    @editItem="openEditAppItem"
    @deleteItem="deleteAppItem"
    ref="commonPanelRef" />
</template>

<script setup lang="ts">
import { open as tauriOpen } from "@tauri-apps/plugin-dialog";
import { getConfig, setConfig } from "@/utils/config.ts";
import { ref, computed } from "vue";
import { SelectItem } from "@/types/common";
import { showMessage } from "@/composables/message.ts";
import { on } from "@/utils/eventBus";
import { ipcDeleteIcon, ipcGetAppIcon, ipcOpen } from "@/api/ipc/launch.api";
import CommonPanel from "@/components/items/CommonPanel.vue";
import { PathHandler } from "@/utils/pathHandler";
import { AppConfig } from "@/types/database";
import { DisplayModeEnum, ItemTypeEnum } from "@/types/enum";
import { Logger } from "@/utils/logger";

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
    const config = await getConfig<AppConfig>("appConfig");
    dataList.value = config?.dataList || [];
    if (config?.displayMode !== undefined) {
      displayMode.value = config.displayMode;
    }
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }
  on("edit-appItem", openEditAppItem);
  on("delete-appItem", deleteAppItem);
};

const openApp = async (item: SelectItem) => {
  ipcOpen(item.path)
    .then(() => {
      visible.value = false;
    })
    .catch(() => {
      showMessage("打开失败!", 3000, 2);
    });
};

const addAppItem = async () => {
  const newItem = PathHandler.createDefaultItem();
  newItem.id = Date.now();

  const filePath = (await tauriOpen({
    multiple: false,
    directory: false,
  })) as string;

  const formattedFilePath = filePath.replace(/\\/g, "/");
  newItem.path = formattedFilePath;

  let fileName = formattedFilePath.substring(
    formattedFilePath.lastIndexOf("/") + 1,
  );

  if (fileName.toLowerCase().endsWith(".exe")) {
    fileName = fileName.slice(0, -4);
  }

  newItem.title = fileName;

  try {
    newItem.logo = (await ipcGetAppIcon(filePath)) as string;

    dataList.value.push(newItem);
    await setConfig("appConfig", {
      dataList: dataList.value,
      displayMode: displayMode.value,
    } as AppConfig);
  } catch (error) {
    showMessage("添加应用失败!", 3000, 2);
  }
};

const openEditAppItem = (item: SelectItem) => {
  commonPanelRef.value?.openEditModal(item);
};

const deleteAppItem = async (id: number) => {
  const index = dataList.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    const filePath = dataList.value[index].logo;
    const fileName = dataList.value[index].logo.substring(
      filePath.lastIndexOf("\\") + 1,
    );
    dataList.value.splice(index, 1);
    try {
      await setConfig("appConfig", {
        dataList: dataList.value,
        displayMode: displayMode.value,
      } as AppConfig);
      ipcDeleteIcon(fileName, ItemTypeEnum.App).catch((err) => {
        Logger.error(err, "图标删除失败:");
      });
      showMessage("删除成功!", 3000, 1);
    } catch (error) {
      showMessage("删除失败!", 3000, 2);
    }
  }
};

const editAppItem = async (updatedItem: SelectItem) => {
  const index = dataList.value.findIndex((item) => item.id === updatedItem.id);
  if (index !== -1) {
    dataList.value[index] = updatedItem;

    try {
      await setConfig("appConfig", {
        dataList: dataList.value,
        displayMode: displayMode.value,
      } as AppConfig);
      showMessage("更新成功!", 3000, 1);
    } catch (error) {
      showMessage("更新失败!", 3000, 2);
    }
  } else {
    showMessage("更新失败!", 3000, 2);
  }
};

defineExpose({
  visible,
});
</script>
