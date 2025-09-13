<template>
  <div class="menu-container">
    <!-- 主功能网格 -->
    <div class="menu-grid">
      <!-- 常用网站卡片 -->
      <div
        class="glass-card menu-card hover-lift"
        @click="openCommon('commonWeb')">
        <div class="card-header">
          <div
            class="icon-container web-theme"
            style="width: 24px; height: 24px; font-size: 12px">
            <i class="pi pi-globe"></i>
          </div>
          <span class="card-title">网站</span>
          <i class="pi pi-external-link action-icon"></i>
        </div>
      </div>

      <!-- 常用软件卡片 -->
      <div
        class="glass-card menu-card hover-lift"
        @click="openCommon('commonApp')">
        <div class="card-header">
          <div
            class="icon-container app-theme"
            style="width: 24px; height: 24px; font-size: 12px">
            <i class="pi pi-desktop"></i>
          </div>
          <span class="card-title">软件</span>
          <i class="pi pi-external-link action-icon"></i>
        </div>
      </div>

      <!-- 快捷输入卡片 -->
      <div
        class="glass-card menu-card hover-lift"
        @click="openCommon('quickInput')">
        <div class="card-header">
          <div
            class="icon-container input-theme"
            style="width: 24px; height: 24px; font-size: 12px">
            <i class="pi pi-pencil"></i>
          </div>
          <span class="card-title">输入</span>
          <i class="pi pi-external-link action-icon"></i>
        </div>
      </div>

      <!-- 我的插件卡片 -->
      <div class="glass-card menu-card hover-lift" @click="openMyPlugin">
        <div class="card-header">
          <div
            class="icon-container plugin-theme"
            style="width: 24px; height: 24px; font-size: 12px">
            <i class="pi pi-objects-column"></i>
          </div>
          <span class="card-title">插件</span>
          <i class="pi pi-external-link action-icon"></i>
        </div>
      </div>
    </div>

    <!-- 底部快捷操作 -->
    <div class="bottom-actions">
      <button class="action-button label-btn" @click="openLabel">
        <i class="pi pi-bookmark"></i>
        <span>便签</span>
      </button>
      <button class="action-button market-btn" @click="openPluginMarket">
        <i class="pi pi-shopping-cart"></i>
        <span>市场</span>
      </button>
    </div>

    <!-- 弹窗组件 -->
    <CommonWeb :ref="commonState['commonWeb']" />
    <CommonApp :ref="commonState['commonApp']" />
    <QuickInput :ref="commonState['quickInput']" />

    <!-- 我的插件 -->
    <MyPlugin ref="myPluginRef" />
  </div>
</template>

<script setup lang="ts">
import CommonWeb from "@/views/web/CommonWeb.vue";
import CommonApp from "@/views/app/CommonApp.vue";
import QuickInput from "@/views/quick-input/QuickInput.vue";
import MyPlugin from "@/views/my-plugin/MyPlugin.vue";
import { ref, toRef, type Ref, onMounted, onUnmounted } from "vue";
import { ContainState, type CommonState } from "@/interface/menu.d";
import { handleWindowToggle } from "@/utils/windowManager";
import { NewWindowEnum, WINDOW_CONFIG } from "@/interface/windowEnum";
import { on, off } from "@/utils/eventBus";

const myPluginRef = ref<InstanceType<typeof MyPlugin> | null>(null);
const commonState = {
  commonWeb: ref<InstanceType<typeof CommonWeb> | null>(null),
  commonApp: ref<InstanceType<typeof CommonApp> | null>(null),
  quickInput: ref<InstanceType<typeof QuickInput> | null>(null),
} as Record<CommonState, Ref<InstanceType<typeof CommonWeb> | null>>;
/** 控制需要新建窗口的状态 */
const containState = ref<ContainState>({
  label: false,
  pluginMarket: false,
});

/** 打开菜单项 */
const openCommon = (key: CommonState) => {
  const target = commonState[key];
  if (!target.value) return;

  Object.entries(commonState).forEach(([k, ref]) => {
    if (k !== key && ref.value) {
      ref.value.visible = false;
    }
  });

  target.value.visible = true;
};

/** 打开桌面便签 */
const openLabel = () => {
  handleWindowToggle(
    WINDOW_CONFIG[NewWindowEnum.Label],
    toRef(containState.value, "label"),
  );
};

/** 打开插件市场 */
const openPluginMarket = () => {
  handleWindowToggle(
    WINDOW_CONFIG[NewWindowEnum.PluginMarket],
    toRef(containState.value, "pluginMarket"),
  );
};

/** 打开我的插件 */
const openMyPlugin = () => {
  myPluginRef.value?.openPopover();
};

// 快捷键事件处理函数
const handleHotkeyWebList = () => openCommon("commonWeb");
const handleHotkeyAppList = () => openCommon("commonApp");
const handleHotkeyQuickInput = () => openCommon("quickInput");

onMounted(() => {
  // 通过eventBus监听来自hotkey.ts的事件
  on("hotkey-open-commonWeb", handleHotkeyWebList);
  on("hotkey-open-commonApp", handleHotkeyAppList);
  on("hotkey-open-quickInput", handleHotkeyQuickInput);
});

onUnmounted(() => {
  // 清理eventBus事件监听器
  off("hotkey-open-commonWeb");
  off("hotkey-open-commonApp");
  off("hotkey-open-quickInput");
});
</script>

<style lang="less">
.menu-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: visible;
}

.menu-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-card {
  .card-header {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    gap: 8px;

    .card-title {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: var(--theme-text);
      text-align: left;
      margin-top: 0;
    }

    .action-icon {
      font-size: 10px;
      color: var(--theme-text-muted);
      transition: all 0.2s ease;
    }
  }
}

.bottom-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;

  .action-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    border-radius: var(--theme-radius-sm);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(
      var(--theme-background-secondary-rgb),
      var(--theme-transparency-background-secondary)
    );

    i,
    span {
      position: relative;
      z-index: 1;
    }

    &.label-btn {
      background: linear-gradient(
        135deg,
        rgba(var(--theme-warning-rgb), 0.9) 0%,
        rgba(var(--theme-warning-rgb), 0.7) 100%
      );
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: rgba(var(--theme-background-rgb), 0.9);
      border: 1px solid rgba(var(--theme-warning-rgb), 0.8);
      position: relative;
      overflow: hidden;
      box-shadow:
        0 2px 8px rgba(var(--theme-warning-rgb), 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);

      // 便签纸撕裂效果 - 右上角
      &::before {
        content: "";
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background:
          radial-gradient(
            circle at 50% 50%,
            transparent 30%,
            rgba(var(--theme-warning-rgb), 0.3) 35%
          ),
          conic-gradient(
            from 45deg at 50% 50%,
            transparent 0deg,
            rgba(var(--theme-warning-rgb), 0.8) 90deg,
            transparent 180deg
          );
        transform: rotate(45deg);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      // 纸质纹理效果
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
          repeating-linear-gradient(
            90deg,
            transparent 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 2px
          ),
          repeating-linear-gradient(
            0deg,
            transparent 0px,
            rgba(255, 255, 255, 0.02) 1px,
            transparent 3px
          );
        pointer-events: none;
      }

      &:hover {
        transform: translateY(-3px) scale(1.03) rotate(0.5deg);
        background: linear-gradient(
          135deg,
          var(--theme-warning) 0%,
          rgba(var(--theme-warning-rgb), 0.85) 100%
        );
        box-shadow:
          0 6px 20px rgba(var(--theme-warning-rgb), 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        color: rgba(var(--theme-background-rgb), 0.95);

        &::before {
          transform: rotate(45deg) scale(1.2);
        }
      }
    }

    &.market-btn {
      background: linear-gradient(
        135deg,
        rgba(var(--theme-success-rgb), 0.9) 0%,
        rgba(var(--theme-success-rgb), 0.7) 100%
      );
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      color: rgba(var(--theme-background-rgb), 0.9);
      border: 1px solid rgba(var(--theme-success-rgb), 0.8);
      position: relative;
      overflow: hidden;
      box-shadow:
        0 2px 8px rgba(var(--theme-success-rgb), 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);

      // 金币装饰效果
      &::before {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 8px;
        height: 8px;
        background: radial-gradient(
          circle,
          rgba(255, 215, 0, 0.8) 0%,
          rgba(255, 215, 0, 0.4) 50%,
          transparent 100%
        );
        border-radius: 50%;
        box-shadow:
          0 0 4px rgba(255, 215, 0, 0.6),
          inset 0 1px 2px rgba(255, 255, 255, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      // 钱袋纹理效果
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
          radial-gradient(
            circle at 25% 25%,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 30%
          ),
          radial-gradient(
            circle at 75% 75%,
            rgba(255, 255, 255, 0.05) 0%,
            transparent 40%
          );
        pointer-events: none;
      }

      &:hover {
        transform: translateY(-3px) scale(1.03);
        background: linear-gradient(
          135deg,
          var(--theme-success) 0%,
          rgba(var(--theme-success-rgb), 0.85) 100%
        );
        box-shadow:
          0 6px 20px rgba(var(--theme-success-rgb), 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        color: rgba(var(--theme-background-rgb), 0.95);

        &::before {
          width: 10px;
          height: 10px;
          box-shadow:
            0 0 8px rgba(255, 215, 0, 0.8),
            0 0 12px rgba(255, 215, 0, 0.4),
            inset 0 1px 2px rgba(255, 255, 255, 0.4);
        }
      }
    }

    &:active {
      transform: scale(0.98);
    }

    i {
      font-size: 12px;
    }

    span {
      font-size: 11px;
    }
  }
}
</style>
