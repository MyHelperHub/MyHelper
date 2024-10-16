<template>
  <div class="home" data-tauri-drag-region>
    <div class="top-container">
      <div class="brand">
        <img class="logo" src="/logo.png" @click="showMenu" />
      </div>
    </div>
    <Transition name="transition">
      <Menu v-show="isShowMenu"></Menu>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { hideMessage } from "@/utils/message";
import Menu from "./Menu.vue";
import { invoke } from "@tauri-apps/api/core";
import { ref } from "vue";

const isShowMenu = ref(false);
const showMenu = () => {
  hideMessage();
  const [width, height] = isShowMenu.value ? [65, 65] : [250, 420];
  invoke("set_window_size", { width, height });
  isShowMenu.value = !isShowMenu.value;
};
</script>
<style lang="less">
.home {
  width: 100%;
  height: 100%;

  .brand {
    width: fit-content;
    height: fit-content;
    cursor: pointer;

    .logo {
      position: absolute;
      left: 3px;
      top: 3px;
      height: 60px;
      width: 60px;
      border-radius: 50%;
      border: 4px solid rgba(230, 235, 240, 0.8);
      z-index: 1;
      // 禁止拖动
      -webkit-user-drag: none;
    }
  }
}

.transition-enter-from,
.transition-leave-to {
  opacity: 0;
}

.transition-enter-to,
.transition-leave-from {
  opacity: 1;
}

.transition-enter-active,
.transition-leave-active {
  transition: opacity 0.5s ease-in-out;
}
</style>
