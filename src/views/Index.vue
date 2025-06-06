<template>
  <div class="app-container w-full h-full overflow-hidden">
    <div class="brand absolute left-3 top-3 z-2" data-tauri-drag-region>
      <img
        class="logo h-60px w-60px rounded-full cursor-pointer z-1 select-none"
        :src="avatarLogo"
        @click="showMenu" />
    </div>
    <Transition name="panel-transition">
      <div
        v-if="isShowMenu"
        class="home w-full h-full box-border border-1 border-solid border-[rgba(230,235,240,0.7)] rounded-20px bg-gradient-to-b from-[#e5edf1] to-[#9fc0cf] list-none">
        <div class="settings absolute right-0 top-10px z-3">
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
        <Search class="search relative top-72px" />
        <span class="parting-line"></span>
        <Menu></Menu>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import SpeedDial from "primevue/speeddial";
import { hideMessage } from "@/utils/message";
import Search from "@/views/Search.vue";
import Menu from "./Menu.vue";
import { computed, ref, toRef } from "vue";
import { ipcSetWindowSize } from "@/api/ipc/window.api";
import { listen } from "@tauri-apps/api/event";
import { emit } from "@/utils/eventBus";
import { handleWindowToggle } from "@/utils/windowManager";
import { NewWindowEnum, WINDOW_CONFIG } from "@/interface/windowEnum";
import { checkLogoPath } from "@/utils/user";
import { delay } from "@/utils/common";

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

const showMenu = async () => {
  hideMessage();

  let width: number;
  let height: number;

  if (isShowMenu.value) {
    width = 65;
    height = 65;
    isShowMenu.value = false;
    // 等待动画完成后再调整窗口大小
    await delay(280).then(() => {
      ipcSetWindowSize(width, height);
    });
  } else {
    width = 250;
    height = 420;
    ipcSetWindowSize(width, height);
    emit("closeAllMenu");
    isShowMenu.value = true;
  }
};
</script>

<style lang="less">
.app-container {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}

.home {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(230, 235, 240, 0.7);
  border-radius: 20px;
  background: linear-gradient(#e5edf1, #9fc0cf);
  list-style-type: none;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  position: relative;

  .parting-line {
    position: absolute;
    display: block;
    top: 65px;
    left: 0;
    width: 100%;
    height: 1px;
    background-color: rgba(58, 69, 80, 0.2);
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
    cursor: pointer;
    z-index: 1;
    // 禁止拖动
    -webkit-user-drag: none;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}

.panel-transition-enter-active {
  animation: panel-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transform-origin: 33px 33px; 

  .parting-line {
    animation: none;
  }
}

.panel-transition-leave-active {
  animation: panel-out 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  transform-origin: 33px 33px;

  .parting-line {
    animation: none;
  }
}

@keyframes panel-in {
  0% {
    opacity: 0;
    transform: scale(0.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes panel-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.2);
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes fade-out {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
