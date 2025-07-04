<template>
  <div class="app-container w-full h-full overflow-hidden">
    <!-- 小窗模式logo - 固定位置 -->
    <div
      v-if="!isShowMenu"
      class="brand absolute left-3 top-3 z-2"
      data-tauri-drag-region>
      <img
        class="logo h-60px w-60px rounded-full cursor-pointer z-1 select-none"
        :src="avatarLogo"
        @click="showMenu" />
    </div>

    <!-- 大窗模式：显示完整界面 -->
    <Transition name="panel-transition">
      <div
        v-if="isShowMenu"
        class="main-panel backdrop-blur-md bg-gradient-to-br from-blue-100/90 via-purple-50/90 to-indigo-100/90 border border-white/30 rounded-2xl shadow-2xl">
        <!-- 头部区域 -->
        <div class="header-section">
          <!-- Logo和标题 -->
          <div class="header-left">
            <img class="avatar-logo" :src="avatarLogo" @click="showMenu" />
            <div class="app-title">
              <span class="title-text">MyHelper</span>
              <span class="subtitle-text">智能助手</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="header-actions">
            <button
              class="action-btn"
              @click="handleAction('my')"
              v-tooltip.bottom="'我的'">
              <i class="pi pi-user"></i>
            </button>
            <button
              class="action-btn"
              @click="handleAction('settings')"
              v-tooltip.bottom="'设置'">
              <i class="pi pi-cog"></i>
            </button>
          </div>
        </div>

        <!-- 搜索区域 -->
        <div class="search-section">
          <Search />
        </div>

        <!-- 主要内容区域 -->
        <div class="content-section">
          <Menu />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef } from "vue";
import { ipcSetWindowSize } from "@/api/ipc/window.api";
import { listen } from "@tauri-apps/api/event";
import { handleWindowToggle } from "@/utils/windowManager";
import { NewWindowEnum, WINDOW_CONFIG } from "@/interface/windowEnum";
import { checkLogoPath } from "@/utils/user";
import { delay } from "@/utils/common";
import { hideMessage } from "@/utils/message";
import Search from "@/views/Search.vue";
import Menu from "./Menu.vue";

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
    icon: "pi pi-cog",
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

const handleAction = (action: "my" | "settings") => {
  menuItems.value[action].command();
};

const showMenu = async () => {
  hideMessage();

  let width: number;
  let height: number;

  if (isShowMenu.value) {
    width = 65;
    height = 65;
    isShowMenu.value = false;
    // 等待动画完成后再调整窗口大小
    await delay(220).then(() => {
      ipcSetWindowSize(width, height);
    });
  } else {
    width = 250;
    height = 420;
    ipcSetWindowSize(width, height);
    isShowMenu.value = true;
  }
};
</script>

<style lang="less">
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
}

// 小窗模式样式 - 固定定位
.brand {
  position: absolute;
  left: 3px;
  top: 3px;
  z-index: 2;
  animation: logo-appear 0.25s cubic-bezier(0.25, 1, 0.5, 1);

  .logo {
    height: 60px;
    width: 60px;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1;
    user-select: none;
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

@keyframes logo-appear {
  0% {
    opacity: 0;
    transform: scale(0.88);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes logo-slide-in {
  0% {
    opacity: 0;
    transform: translate(-4px, -8px) scale(1.875);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
}

@keyframes title-fade-in {
  0% {
    opacity: 0;
    transform: translateX(-8px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes actions-fade-in {
  0% {
    opacity: 0;
    transform: translateX(8px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes section-fade-in {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

// 大窗模式样式
.main-panel {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .avatar-logo {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(79, 109, 245, 0.2);
      animation: logo-slide-in 0.3s cubic-bezier(0.25, 1, 0.5, 1);

      &:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(79, 109, 245, 0.3);
      }
    }

    .app-title {
      display: flex;
      flex-direction: column;
      line-height: 1;
      animation: title-fade-in 0.25s cubic-bezier(0.25, 1, 0.5, 1) 0.05s both;

      .title-text {
        font-size: 14px;
        font-weight: 600;
        color: #2d3748;
        background: linear-gradient(135deg, #4f6df5, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .subtitle-text {
        font-size: 10px;
        color: #718096;
        margin-top: 1px;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 6px;
    animation: actions-fade-in 0.25s cubic-bezier(0.25, 1, 0.5, 1) 0.08s both;

    .action-btn {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(10px);
      color: #4a5568;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;

      &:hover {
        background: rgba(255, 255, 255, 0.8);
        transform: scale(1.1);
        color: #2d3748;
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

.search-section {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  animation: section-fade-in 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.12s both;
}

.content-section {
  flex: 1;
  padding: 8px 16px 16px;
  overflow: hidden;
  animation: section-fade-in 0.2s cubic-bezier(0.25, 1, 0.5, 1) 0.15s both;
}

// 从左上角展开的平滑动画
.panel-transition-enter-active {
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  transform-origin: 33px 33px;
}

.panel-transition-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: 33px 33px;
}

.panel-transition-enter-from {
  opacity: 0;
  transform: scale(0.92);
}

.panel-transition-enter-to {
  opacity: 1;
  transform: scale(1);
}

.panel-transition-leave-from {
  opacity: 1;
  transform: scale(1);
}

.panel-transition-leave-to {
  opacity: 0;
  transform: scale(0.94);
}
</style>
