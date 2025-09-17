<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :dismissableMask="true"
    :closable="false"
    :showHeader="false"
    :style="{ top: '60px', left: '15px' }">
    <div class="web-panel">
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
          @click="navigateTo(item.url)"
          @contextmenu.prevent="(e) => handleContextMenu(e, item)">
          <div class="icon-container">
            <img
              v-if="item.logo"
              :src="convertFileSrc(item.logo)"
              loading="lazy"
              class="icon-image" />
            <i v-else class="pi pi-image"></i>
          </div>
          <div class="card-title">{{ item.title }}</div>
        </div>

        <AddItem
          ref="addItemRef"
          @addWebItem="addWebItem"
          @editWebItem="editWebItem">
          <div class="feature-card add-card hover-lift">
            <div class="icon-container">
              <i class="pi pi-plus"></i>
            </div>
            <div class="card-title">添加</div>
          </div>
        </AddItem>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import AddItem from "@/views/web/AddItem.vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getConfig, setConfig } from "@/utils/config.ts";
import { ref } from "vue";
import { WebItem } from "@/interface/web";
import { showMessage } from "@/composables/message.ts";
import { on } from "@/utils/eventBus";
import { ipcDeleteIcon, ipcOpen } from "@/api/ipc/launch.api";
import ContextMenu from "primevue/contextmenu";
import {
  contextMenuRef,
  menuItems,
  handleContextMenu,
} from "./utils/contextMenu";
import Dialog from "primevue/dialog";
import { ErrorHandler } from "@/utils/errorHandler";

const dataList = ref<WebItem[]>([]);
const addItemRef = ref<InstanceType<typeof AddItem> | null>(null);
const visible = ref(false);

const init = async () => {
  try {
    const config = await getConfig<{ dataList: WebItem[] }>("webConfig");
    dataList.value = config?.dataList || [];
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }
  on("edit-webItem", openEditWebItem);
  on("delete-webItem", deleteWebItem);
};
init();

/** 打开编辑网站弹窗 */
const openEditWebItem = async (item: WebItem) => {
  addItemRef.value?.openModal(item);
};

/** 跳转到指定链接 */
const navigateTo = (url: string) => {
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }
  ipcOpen(url)
    .then(() => {
      visible.value = false;
    })
    .catch(() => {
      showMessage("打开失败!", 3000, 2);
    });
};

/** 添加网站时触发事件 */
const addWebItem = async (item: WebItem) => {
  item.id = Date.now();
  dataList.value.push(item);
  try {
    await setConfig("webConfig", { dataList: dataList.value });
  } catch (error) {
    dataList.value.pop();
    showMessage("保存失败!", 3000, 2);
  }
};

/** 编辑网站 */
const editWebItem = async (updatedItem: WebItem) => {
  const index = dataList.value.findIndex((item) => item.id === updatedItem.id);

  if (index !== -1) {
    dataList.value[index] = updatedItem;

    // 更新本地配置
    try {
      await setConfig("webConfig", { dataList: dataList.value });
      showMessage("更新成功!", 3000, 1);
    } catch (error) {
      showMessage("更新失败!", 3000, 2);
    }
  } else {
    showMessage("更新失败!", 3000, 2);
  }
};

/** 删除某个网站 */
const deleteWebItem = async (id: number) => {
  const index = dataList.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    //暂存logo文件名
    const filePath = dataList.value[index].logo;
    const fileName = dataList.value[index].logo.substring(
      filePath.lastIndexOf("/") + 1,
    );

    dataList.value.splice(index, 1);
    try {
      await setConfig("webConfig", { dataList: dataList.value });
      ipcDeleteIcon(fileName, 0).catch((err) => {
        ErrorHandler.handleError(err, "图标删除失败:");
      });
      showMessage("删除成功!", 3000, 1);
    } catch (error) {
      showMessage("删除失败!", 3000, 2);
    }
  }
};

defineExpose({ visible });
</script>

<style lang="less">
.web-panel {
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
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));

    &:hover {
      background: rgba(
        var(--theme-background-secondary-rgb),
        var(--theme-transparency-background-secondary)
      );
      box-shadow: var(--theme-shadow-md);
      border-color: var(--theme-primary);
    }
  }

  .add-card {
    background: rgba(var(--theme-primary-rgb), 0.08);
    border: 1px dashed
      rgba(var(--theme-primary-rgb), var(--theme-transparency-border));

    &:hover {
      background: rgba(var(--theme-primary-rgb), 0.12);
      border: 1px dashed
        rgba(
          var(--theme-primary-rgb),
          calc(var(--theme-transparency-border) * 1.5)
        );
      box-shadow: var(--theme-shadow-sm);
    }

    .icon-container {
      color: var(--theme-primary);
      background: rgba(
        var(--theme-background-rgb),
        var(--theme-transparency-background-secondary)
      );
    }
  }
}
</style>
