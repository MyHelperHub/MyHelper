<template>
  <div class="clipboard-container">
    <!-- 右键菜单组件 -->
    <ContextMenu
      ref="clipboardContextMenuRef"
      :model="clipboardMenuItems"
      :pt="{
        root: { style: 'width: 120px; min-width: 120px' },
      }" />

    <!-- 使用虚拟列表替换原有的滚动容器 -->
    <VirtualList
      :items="clipboardData"
      :item-height="46"
      :container-height="280"
      key-field="id"
      :overscan="3"
      class="virtual-scroll-container">
      <template #default="{ item }">
        <div
          class="item"
          @click="pasteTo(item)"
          @contextmenu.prevent="(e) => handleClipboardContextMenu(e, item)">
          <div class="text">
            {{ item.text ? item.text : "请输入内容..." }}
          </div>
        </div>
      </template>
    </VirtualList>
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
.clipboard-container {
  gap: 5px;
  margin: 0 10px;

  .virtual-scroll-container {
    margin: 3px 0;
  }

  .item {
    position: relative;
    height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f2f4f5;
    border: 1px solid #dcdcdc;
    border-radius: 5px;
    padding: 6px 8px;
    transition: background-color 0.3s;
    margin: 3px 0;
    cursor: pointer;

    .text {
      font-size: 12px;
      margin: 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      text-overflow: ellipsis;
    }

    &:hover {
      background-color: #e6e9ed;
    }
  }
}
</style>
