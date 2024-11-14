<template>
  <div class="brand" data-tauri-drag-region>
    <img class="logo" :src="avatarLogo" @click="showMenu" />
  </div>
  <Transition name="transition">
    <div v-show="isShowMenu" class="home">
      <div class="settings">
        <SpeedDial
          v-if="isShowMenu"
          class="speed-dial"
          button-class="p-button-text"
          show-icon="pi pi-bars"
          hide-icon="pi pi-times"
          :model="menuItemsArray"
          :radius="55"
          type="quarter-circle"
          direction="down-left"
          :tooltipOptions="{ position: 'left', event: 'hover' }" />
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
import { computed, ref, toRef } from "vue";
import { ipcSetWindowSize } from "@/api/ipc/window.api";
import { listen } from "@tauri-apps/api/event";
import { checkLogoPath } from "@/utils/avatar";
import { emit } from "@/utils/eventBus";
import { handleWindowToggle } from "@/utils/windowManager";
import { NewWindowEnum, WINDOW_CONFIG } from "@/interface/windowEnum";

const isShowMenu = ref(false);
const avatarLogo = ref("/logo.png");

const init = () => {
  checkLogoPath().then((path) => {
    avatarLogo.value = path;
  });
  listen("update:logo", () => {
    checkLogoPath().then((path) => {
      avatarLogo.value = path;
    });
  });
};

init();

const menuItems = ref({
  settings: {
    label: "设置",
    icon: "pi pi-wrench",
    isOpen: false,
    command: () => {
      handleWindowToggle(
        WINDOW_CONFIG[NewWindowEnum.Setting],
        toRef(menuItems.value.settings, "isOpen"),
      );
    },
  },
  my: {
    label: "我的",
    icon: "pi pi-user",
    isOpen: false,
    command: () => {
      handleWindowToggle(
        WINDOW_CONFIG[NewWindowEnum.My],
        toRef(menuItems.value.my, "isOpen"),
      );
    },
  },
});

// 将menuItems转为数组以供SpeedDial使用
const menuItemsArray = computed(() => Object.values(menuItems.value));

const showMenu = () => {
  hideMessage();

  let width;
  let height;

  if (isShowMenu.value) {
    width = 65;
    height = 65;
  } else {
    width = 250;
    height = 420;
    emit("closeAllMenu");
  }

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
    z-index: 3;
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
  position: absolute;
  left: 3px;
  top: 3px;
  z-index: 2;
  .logo {
    height: 60px;
    width: 60px;
    border-radius: 50%;
    border: 4px solid rgba(230, 235, 240, 0.8);
    cursor: pointer;
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
