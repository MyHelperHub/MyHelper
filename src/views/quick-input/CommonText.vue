<template>
  <div class="common">
    <div v-for="item in formData" :key="item.id" class="item">
      <div class="text" @click="handleClick(item)">{{ item.text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { commonTextItem } from "@/interface/quickInput";
import { invoke } from "@tauri-apps/api/core";
import { ref } from "vue";

const formData = ref<commonTextItem[]>([
  { id: 0, text: "你好你好" },
  {
    id: 1,
    text: "按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本按钮2文本",
  },
  { id: 2, text: "按钮3文本" },
  { id: 3, text: "按钮4文本" },
  { id: 4, text: "按钮5文本" },
  { id: 4, text: "按钮5文本" },
  { id: 4, text: "按钮5文本" },
]);

const handleClick = (item: commonTextItem) => {
  console.log(item);
  invoke("plugin:paste|paste");
};
</script>

<style lang="less">
.common {
  gap: 5px;
  margin: 0 10px;
  max-height: 280px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.item {
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background-color: #f2f4f5;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
  padding: 8px;
  transition: background-color 0.3s;
  margin: 6px 0;

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
</style>
