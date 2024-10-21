<template>
  <div class="top-container">
    <div class="brand">
      <img class="logo" src="/logo.png" @click="showMenu" />
    </div>
  </div>
  <Transition name="transition">
    <div v-show="isShowMenu" class="home">
      <div class="settings">
        <SpeedDial
          class="speed-dial"
          button-class="p-button-text"
          show-icon="pi pi-bars"
          hide-icon="pi pi-times"
          :model="menuItemsArray"
          :radius="55"
          type="quarter-circle"
          direction="down-left"
          :tooltipOptions="{ position: 'left' }" />
      </div>
      <Search class="search" />
      <span class="parting-line"></span>
      <Menu></Menu>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import SpeedDial from "primevue/speeddial";
import { hideMessage } from "@/utils/message";
import Search from "@/views/Search.vue";
import Menu from "./Menu.vue";
import { computed, ref } from "vue";
import { ipcCreateNewWindow, ipcSetWindowSize } from "@/api/ipc/window.api";

const isShowMenu = ref(false);

const menuItems = ref({
  settings: {
    label: "设置",
    icon: "pi pi-wrench",
    isOpen: false,
    command: () => {
      ipcCreateNewWindow(
        menuItems.value.settings.isOpen,
        "setting",
        "设置",
        "#/setting",
        [350, 550],
      );
    },
  },
  my: {
    label: "我的",
    icon: "pi pi-user",
    isOpen: false,
  },
});

// 将menuItems转为数组以供SpeedDial使用
const menuItemsArray = computed(() => Object.values(menuItems.value));

const showMenu = () => {
  hideMessage();
  const [width, height] = isShowMenu.value ? [65, 65] : [250, 420];
  ipcSetWindowSize(width, height);
  isShowMenu.value = !isShowMenu.value;
};
</script>
<style lang="less">
.home {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(230, 235, 240, 0.7);
  border-radius: 20px;
  background: linear-gradient(#e5edf1, #9fc0cf);
  list-style-type: none;
  -webkit-font-smoothing: antialiased;
  .parting-line {
    position: absolute;
    top: 65px;
    width: 100%;
    margin-left: -1px;
    border: none;
    border-top: 1px solid rgba(58, 69, 80, 0.2);
  }
  .search {
    position: relative;
    top: 72px;
  }
  .settings {
    position: absolute;
    right: 0;
    top: 10px;
    .speed-dial {
      .p-speeddial-button {
        width: 30px;
        height: 30px;
        --p-button-text-primary-color: #3c3d3d;
        --p-button-text-primary-hover-background: rgb(213, 232, 241);
      }
    }
  }
}
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
