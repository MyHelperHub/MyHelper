<template>
  <div class="clipboard-container">
    <div class="scroll-container">
      <div
        v-for="item in formData"
        :key="item.id"
        class="item"
        @click="pasteTo(item)">
        <div class="text">
          {{ item.text ? item.text : "请输入内容..." }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ipcPaste, ipcWriteClipboard } from "@/api/ipc/clipboard.api";
import { QuickInputItem } from "@/interface/quickInput";
import GlobalData from "@/utils/globalData";

const formData = GlobalData.get("clipboardList");

/** 处理复制到剪贴板的功能 */
const pasteTo = (item: QuickInputItem) => {
  ipcWriteClipboard(item.text).then(() => {
    ipcPaste();
  });
};
</script>

<style lang="less">
.clipboard-container {
  gap: 5px;
  margin: 0 10px;

  .scroll-container {
    overflow-y: auto;
    max-height: 280px;
    min-height: 280px;

    &::-webkit-scrollbar {
      display: none;
    }

    .item {
      position: relative;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f2f4f5;
      border: 1px solid #dcdcdc;
      border-radius: 5px;
      padding: 8px;
      transition: background-color 0.3s;
      margin: 6px 0;
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
}
</style>
