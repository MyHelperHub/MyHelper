<template>
  <div class="clipboard-panel">
    <!-- 右键菜单 -->
    <ContextMenu
      ref="clipboardContextMenuRef"
      :model="clipboardMenuItems"
      :pt="{
        root: { style: 'width: 120px; min-width: 120px' },
      }" />

    <!-- 剪贴板列表 -->
    <VirtualList
      :items="clipboardData"
      :item-height="52"
      :container-height="280"
      key-field="id"
      :overscan="3"
      class="clipboard-list">
      <template #default="{ item }">
        <div
          class="theme-list-card clipboard-item"
          @click="pasteTo(item)"
          @contextmenu.prevent="(e) => handleClipboardContextMenu(e, item)">
          
          <!-- 简单图标 -->
          <div class="item-icon">
            <i class="pi pi-copy"></i>
          </div>

          <!-- 内容区域 -->
          <div class="item-content">
            <div class="item-text">
              {{ item.text || "空内容" }}
            </div>
          </div>
        </div>
      </template>
    </VirtualList>

    <!-- 空状态 -->
    <div v-if="clipboardData.length === 0" class="empty-state">
      <div class="empty-icon">
        <i class="pi pi-clipboard"></i>
      </div>
      <div class="empty-text">
        <span class="empty-title">暂无剪贴板历史</span>
        <span class="empty-subtitle">复制内容后会在这里显示</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ipcPaste, ipcWriteClipboard } from "@/api/ipc/clipboard.api";
import { QuickInputItem } from "@/interface/quickInput";
import { clipboardData, removeClipboardItem } from "@/utils/clipboard";
import { on } from "@/utils/eventBus";
import VirtualList from "@/components/VirtualList.vue";
import ContextMenu from "primevue/contextmenu";
import {
  clipboardContextMenuRef,
  clipboardMenuItems,
  handleClipboardContextMenu,
} from "./utils/contextMenu";

// 初始化事件监听
on("delete-clipboardItem", deleteClipboardItem);

/** 删除剪贴板项目 */
function deleteClipboardItem(id: number) {
  removeClipboardItem(id);
}

/** 处理复制到剪贴板的功能 */
const pasteTo = async (item: QuickInputItem) => {
  // 写入剪贴板并执行粘贴
  await ipcWriteClipboard(item.text);
  await ipcPaste();
};
</script>

<style lang="less">
.clipboard-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.clipboard-list {
  flex: 1;
  
  .clipboard-item {
    width: 100%;
    margin-bottom: 6px;
    
    .item-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--theme-text-muted);
      font-size: 12px;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .item-content {
      flex: 1;
      min-width: 0;
      margin-left: 6px;

      .item-text {
        font-size: 13px;
        color: var(--theme-text);
        line-height: 1.4;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        letter-spacing: 0.2px;
      }
    }
    
    
    &:hover .item-icon {
      color: var(--theme-primary);
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 20px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
  border: 1.5px dashed rgba(156, 163, 175, 0.3);
  border-radius: 12px;
  margin: 20px 0;

  .empty-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(
      135deg,
      var(--theme-text-muted),
      var(--theme-border)
    );
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
    opacity: 0.7;
  }

  .empty-text {
    text-align: center;

    .empty-title {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--theme-text-secondary);
      margin-bottom: 4px;
      letter-spacing: 0.3px;
    }

    .empty-subtitle {
      display: block;
      font-size: 10px;
      color: var(--theme-text-muted);
      font-weight: 500;
      letter-spacing: 0.2px;
    }
  }
}
</style>
