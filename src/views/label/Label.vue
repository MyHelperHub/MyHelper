<template>
  <div
    class="label-container"
    v-window-drag
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
        <InputText class="title" placeholder="输入标题..." spellcheck="false" />
        <Textarea
          class="textarea"
          placeholder="输入内容..."
          spellcheck="false" />
      </div>
    </Mochi>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Mochi from "./Mochi/Mochi.vue";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { WindowOperation } from "@/types/enum";
import { showContextMenu } from "./utils/contextMenu";
import { NewWindowEnum } from "@/types/windowEnum";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";

const showCloseButton = ref(false);

const handleClose = () => {
  ipcWindowControl(WindowOperation.Close, { window_id: NewWindowEnum.Label });
};
</script>

<style lang="less">
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
      color: var(--theme-text-muted);

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
    color: var(--theme-text-muted);
    font-size: 16px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--theme-text);
      transform: scale(1.1);
    }
  }
}
</style>
