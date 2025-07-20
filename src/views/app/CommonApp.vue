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
  // 通过事件总线传递方法
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
  // 设置应用路径
  newItem.src = formattedFilePath;

  // 获取文件名
  let fileName = formattedFilePath.substring(
    formattedFilePath.lastIndexOf("/") + 1,
  );

  // 去除 .exe 后缀 (如果存在)
  if (fileName.toLowerCase().endsWith(".exe")) {
    fileName = fileName.slice(0, -4);
  }

  // 设置应用标题
  newItem.title = fileName;

  try {
    // 获取应用图标
    newItem.logo = (await ipcGetAppIcon(filePath)) as string;

    // 更新 dataList 并保存
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
  // 找到要删除的元素索引
  const index = dataList.value.findIndex((item) => item.id === id);
  // 如果找到了，则删除该元素
  if (index !== -1) {
    //暂存logo文件名
    const filePath = dataList.value[index].logo;
    const fileName = dataList.value[index].logo.substring(
      filePath.lastIndexOf("\\") + 1,
    );
    dataList.value.splice(index, 1);
    // 将数据存储到本地配置中
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
  // 找到要更新的网站的索引
  const index = dataList.value.findIndex((item) => item.id === updatedItem.id);
  if (index !== -1) {
    // 使用新的数据更新 dataList 中的对应项
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

<style lang="less" scoped>
.app-panel {
  background: var(--theme-background-card) !important;
  color: var(--theme-text) !important;

  .grid-3 {
    max-height: 175px;
  }

  .card-title {
    max-width: 100%;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-height: 1.2;
    max-height: calc(1.2em * 3);
  }

  .feature-card {
    background: linear-gradient(
      145deg,
      rgba(var(--theme-background-rgb), 0.9),
      rgba(var(--theme-error-rgb), 0.04)
    ) !important;

    &:hover {
      background: linear-gradient(
        145deg,
        rgba(var(--theme-background-rgb), 0.95),
        rgba(var(--theme-error-rgb), 0.06)
      ) !important;
      box-shadow:
        0 8px 32px rgba(var(--theme-error-rgb), 0.15),
        var(--theme-shadow-sm) !important;
      border-color: rgba(var(--theme-error-rgb), 0.3) !important;
    }
  }

  .add-card {
    background: linear-gradient(
      145deg,
      rgba(var(--theme-error-rgb), 0.08),
      rgba(var(--theme-error-rgb), 0.05)
    ) !important;
    border: 1px dashed rgba(var(--theme-error-rgb), 0.3) !important;

    &::before {
      background: linear-gradient(
        90deg,
        transparent,
        rgba(var(--theme-error-rgb), 0.4),
        transparent
      ) !important;
    }

    &:hover {
      background: linear-gradient(
        145deg,
        rgba(var(--theme-error-rgb), 0.12),
        rgba(var(--theme-error-rgb), 0.08)
      ) !important;
      border: 1px dashed rgba(var(--theme-error-rgb), 0.4) !important;
      box-shadow:
        0 8px 32px rgba(var(--theme-error-rgb), 0.2),
        var(--theme-shadow-sm) !important;
    }

    .icon-container {
      color: var(--theme-error) !important;
    }
  }
}
</style>
