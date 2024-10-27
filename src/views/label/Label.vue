<template>
  <div
    class="label-container"
    data-tauri-drag-region
    @mouseover="showCloseButton = true"
    @mouseleave="showCloseButton = false"
    @contextmenu="showContextMenu">
    <i
      v-if="showCloseButton"
      class="pi pi-times close close-button"
      @click="handleClose"></i>
    <Mochi
      shiba="random"
      mood="happy"
      blush
      left-eye="laugh"
      right-eye="laugh"
      left-ear="down"
      right-ear="down">
      <div class="content">
        <input class="title" placeholder="输入标题..." spellcheck="false" />
        <textarea
          class="textarea"
          placeholder="输入内容..."
          spellcheck="false"></textarea>
      </div>
    </Mochi>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Mochi from "./Mochi/Mochi.vue";
import { ipcCloseWindow } from "@/api/ipc/window.api";
import { showContextMenu } from "./utils/contextMenu";

const showCloseButton = ref(false);

const handleClose = () => {
  ipcCloseWindow("label");
};
</script>

<style lang="less" scoped>
.label-container {
  height: 100vh;
  width: 100vw;

  .content {
    height: inherit;
    width: 100%;

    .title {
      font-size: 22px;
      font-weight: bold;
      width: 100%;
      border: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .textarea {
      border: 0;
      background-color: transparent;
      width: 100%;
      height: 50%;
      font-size: 18px;
      font-weight: bold;
      resize: none;
      color: #666464;

      /* 隐藏滚动条的样式 */
      &::-webkit-scrollbar {
        width: 0;
      }

      -ms-overflow-style: none;
      scrollbar-width: none;
      overflow-y: auto;

      &::-webkit-scrollbar-track {
        background: transparent;
      }
    }
  }

  .close-button {
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;
  }
}
</style>
