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
    <div class="clipboard-list">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="qi-row"
        @click="pasteTo(item)"
        @contextmenu.prevent="(e) => handleClipboardContextMenu(e, item)">
        <div class="row-text">{{ item.text || "空内容" }}</div>
      </div>
    </div>

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
import { clipboardData, removeClipboardItem } from "@/composables/clipboard.ts";
import { on } from "@/utils/eventBus";
import ContextMenu from "primevue/contextmenu";
import { computed } from "vue";
import {
  clipboardContextMenuRef,
  clipboardMenuItems,
  handleClipboardContextMenu,
} from "./utils/contextMenu";

const props = defineProps<{ query?: string }>();

const filtered = computed(() => {
  const q = (props.query || "").trim().toLowerCase();
  if (!q) return clipboardData.value;
  return clipboardData.value.filter((i) =>
    (i.text || "").toLowerCase().includes(q),
  );
});

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

const getFilteredCount = () => filtered.value.length;
defineExpose({ getFilteredCount });
</script>

<style lang="less">
.clipboard-panel {
  padding: 8px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.clipboard-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;

  .qi-row {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 10px;
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    border-radius: 8px;
    background: transparent;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
    cursor: pointer;
    height: 36px;
  }

  .qi-row:hover {
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border-color: rgba(var(--theme-primary-rgb), 0.35);
  }

  .row-text {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--theme-text);
    font-weight: 500;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0.2px;
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
  background: rgba(
    var(--theme-background-secondary-rgb),
    var(--theme-transparency-background-secondary)
  );
  backdrop-filter: blur(8px);
  border: 1.5px dashed
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
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
    color: var(--theme-background);
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
