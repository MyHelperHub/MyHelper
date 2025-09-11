<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :dismissableMask="true"
    :closable="false"
    :showHeader="false"
    :style="{ top: '120px', left: '15px' }">
    <div class="app-panel">
      <ContextMenu
        ref="contextMenuRef"
        :model="menuItems"
        :pt="{
          root: { style: 'width: 120px; min-width: 120px' },
        }" />

      <div class="grid-3">
        <div
          v-for="item in dataList"
          :key="item.id"
          class="feature-card hover-lift"
          v-tooltip.bottom="{
            value: item.title,
            showDelay: 200,
            pt: {
              text: {
                style: {
                  fontSize: '12px',
                },
              },
            },
          }"
          @click="openApp(item.src)"
          @contextmenu.prevent="(e) => handleContextMenu(e, item)">
          <div class="icon-container">
            <img
              v-if="item.logo"
              :src="convertFileSrc(item.logo)"
              loading="lazy"
              class="icon-image" />
            <i v-else class="pi pi-desktop"></i>
          </div>
          <div class="card-title">{{ item.title }}</div>
        </div>

        <div class="feature-card add-card hover-lift" @click="addAppItem">
          <div class="icon-container">
            <i class="pi pi-plus"></i>
          </div>
          <div class="card-title">添加</div>
        </div>
      </div>

      <EditItem ref="editItemRef" @editAppItem="editAppItem"></EditItem>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { open as tauriOpen } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getConfig, setConfig } from "@/utils/config.ts";
import { ref } from "vue";
import { AppItem } from "@/interface/app";
import { showMessage } from "@/composables/message.ts";
import { on } from "@/utils/eventBus";
import { ipcDeleteIcon, ipcGetAppIcon, ipcOpen } from "@/api/ipc/launch.api";
import EditItem from "./EditItem.vue";
import ContextMenu from "primevue/contextmenu";
import {
  contextMenuRef,
  menuItems,
  handleContextMenu,
} from "./utils/contextMenu";
import Dialog from "primevue/dialog";

const dataList = ref<AppItem[]>([]);
const editItemRef = ref<InstanceType<typeof EditItem> | null>(null);
const visible = ref(false);

const init = async () => {
  try {
    const config = await getConfig<{ dataList: AppItem[] }>("appConfig");
    dataList.value = config?.dataList || [];
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }
  on("edit-appItem", openEditAppItem);
  on("delete-appItem", deleteAppItem);
};
init();

/** 打开应用 */
const openApp = async (path: string) => {
  ipcOpen(path)
    .then(() => {
      visible.value = false;
    })
    .catch(() => {
      showMessage("打开失败!", 3000, 2);
    });
};

/** 添加应用 */
const addAppItem = async () => {
  const newItem: AppItem = {
    id: Date.now(),
    src: "",
    title: "",
    logo: "",
  };

  const filePath = (await tauriOpen({
    multiple: false,
    directory: false,
  })) as string;

  const formattedFilePath = filePath.replace(/\\/g, "/");
  newItem.src = formattedFilePath;

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
    await setConfig("appConfig", { dataList: dataList.value });
  } catch (error) {
    showMessage("添加应用失败!", 3000, 2);
  }
};

const openEditAppItem = (item: AppItem) => {
  editItemRef.value?.openModal(item);
};

const deleteAppItem = async (id: number) => {
  const index = dataList.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    //暂存logo文件名
    const filePath = dataList.value[index].logo;
    const fileName = dataList.value[index].logo.substring(
      filePath.lastIndexOf("\\") + 1,
    );
    dataList.value.splice(index, 1);
    try {
      await setConfig("appConfig", { dataList: dataList.value });
      ipcDeleteIcon(fileName, 1).catch((err) => {
        console.log("图标删除失败:", err);
      });
      showMessage("删除成功!", 3000, 1);
    } catch (error) {
      showMessage("删除失败!", 3000, 2);
    }
  }
};

const editAppItem = async (updatedItem: AppItem) => {
  const index = dataList.value.findIndex((item) => item.id === updatedItem.id);
  if (index !== -1) {
    dataList.value[index] = updatedItem;

    // 更新本地配置
    try {
      await setConfig("appConfig", { dataList: dataList.value });
      showMessage("更新成功!", 3000, 1);
    } catch (error) {
      showMessage("更新失败!", 3000, 2);
    }
  } else {
    showMessage("更新失败!", 3000, 2);
  }
};

defineExpose({ visible });
</script>

<style lang="less">
.app-panel {
  .grid-3 {
    max-height: 175px;
  }

  .card-title {
    max-width: 100%;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    line-height: 1.2;
    max-height: calc(1.2em * 3);
  }

  .feature-card {
    background: rgba(var(--theme-background-rgb), var(--theme-transparency-background));
    border: 1px solid rgba(var(--theme-border-rgb), var(--theme-transparency-border));

    &:hover {
      background: var(--p-content-hover-background);
      box-shadow: var(--theme-shadow-md);
      border-color: var(--p-primary-color);
    }
  }

  .add-card {
    background: rgba(var(--theme-background-secondary-rgb), var(--theme-transparency-background-secondary));
    border: 1px dashed var(--p-primary-color);

    &:hover {
      background: rgba(var(--theme-background-secondary-rgb), var(--theme-transparency-background-secondary));
      border: 1px dashed var(--p-primary-600);
      box-shadow: var(--theme-shadow-sm);
    }

    .icon-container {
      color: var(--p-red-500);
    }
  }
}
</style>
