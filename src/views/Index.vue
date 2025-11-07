<template>
  <div class="app-container w-full h-full overflow-hidden">
    <!-- 头像显示 - 根据窗口状态自动调整 -->
    <div
      class="avatar-container"
      :class="{
        'small-mode': !isShowMenu,
        'large-mode': isShowMenu,
      }"
      v-window-drag>
      <AvatarDisplay
        :default-logo="avatarLogo"
        :is-show-menu="isShowMenu"
        @click="showMenu" />
    </div>

    <!-- 大窗模式：显示完整界面 -->
    <Transition name="panel-transition">
      <div v-if="isShowMenu" class="main-panel">
        <!-- 头部区域 -->
        <div class="header-section">
          <!-- 标题区域 - 宠物已经在全局容器中 -->
          <div class="header-left">
            <!-- 占位div，保持布局 -->
            <div class="pet-placeholder"></div>
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
import { listen } from "@tauri-apps/api/event";
import {
  handleWindowToggle,
  handleMainWindowToggle,
  isMainMenuVisible,
} from "@/utils/windowManager";
import { NewWindowEnum, WINDOW_CONFIG } from "@/types/windowEnum";
import { checkLogoPath } from "@/utils/user";
import Search from "@/views/search/Search.vue";
import Menu from "./Menu.vue";
import AvatarDisplay from "@/components/AvatarDisplay.vue";

// 使用全局状态
const isShowMenu = isMainMenuVisible;
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
  await handleMainWindowToggle();
};
</script>

<style lang="less">
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--theme-radius-xl);
  overflow: hidden;
}

// 头像容器样式
.avatar-container {
  position: absolute;
  z-index: 2;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  &.small-mode {
    left: 2px;
    top: 2px;
  }

  &.large-mode {
    left: 14px;
    top: 12px;
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
  border-radius: var(--theme-radius-xl);
  box-shadow: var(--theme-shadow-lg);

  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(
    var(--theme-background-rgb),
    var(--theme-transparency-background)
  );
  border: 1px solid
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  // border-bottom: 1px solid rgba(var(--theme-border-rgb), var(--theme-transparency-border));

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .pet-placeholder {
      width: 32px;
      height: 32px;
      // 占位符，实际的宠物显示在全局容器中
    }

    .app-title {
      display: flex;
      flex-direction: column;
      line-height: 1;
      animation: title-fade-in 0.25s cubic-bezier(0.25, 1, 0.5, 1) 0.05s both;

      .title-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--theme-text);
        background: linear-gradient(
          135deg,
          var(--theme-primary),
          var(--theme-primary-dark)
        );
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .subtitle-text {
        font-size: 10px;
        color: var(--theme-text-muted);
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
      border: 1px solid
        rgba(var(--theme-border-rgb), var(--theme-transparency-border));
      border-radius: 50%;
      background: rgba(
        var(--theme-background-rgb),
        var(--theme-transparency-background)
      );
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: var(--theme-text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      position: relative;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
        border-radius: 50%;
        z-index: -1;
        transition: all 0.2s ease;
      }

      &:hover {
        transform: scale(1.1);
        color: var(--theme-text);
        border-color: var(--theme-primary);
        box-shadow: 0 2px 8px rgba(var(--theme-primary-rgb), 0.3);

        &::before {
          background: rgba(
            var(--theme-background-secondary-rgb),
            var(--theme-transparency-background-secondary)
          );
        }
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }
}

.search-section {
  padding: 8px 16px;
  border-bottom: 1px solid
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
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
