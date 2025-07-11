<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :dismissableMask="true"
    :closable="false"
    :showHeader="false"
    :style="{ top: '50px', left: '10px' }">
    <div class="panel-container quick-input-container">
      <!-- 头部标签切换 -->
      <div class="tab-header">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 0 }"
          @click="activeTab = 0">
          <div class="tab-icon">
            <i class="pi pi-file-edit"></i>
          </div>
          <span>常用文本</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 1 }"
          @click="activeTab = 1">
          <div class="tab-icon">
            <i class="pi pi-clipboard"></i>
          </div>
          <span>剪贴板</span>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="tab-content">
        <transition name="fade-slide" mode="out-in">
          <div v-if="activeTab === 0" key="text" class="content-wrapper">
            <CommonText />
          </div>
          <div v-else key="clipboard" class="content-wrapper">
            <Clipboard />
          </div>
        </transition>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Dialog from "primevue/dialog";
import CommonText from "./CommonText.vue";
import Clipboard from "./Clipboard.vue";

const visible = ref(false);

/** 0为常用，1为剪贴板 */
const activeTab = ref(0);

defineExpose({ visible });
</script>

<style lang="less">
.quick-input-container {
  width: 200px;
  height: 320px;
  display: flex;
  flex-direction: column;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      rgba(var(--theme-primary-rgb), 0.3),
      rgba(var(--theme-success-rgb), 0.3),
      rgba(var(--theme-primary-rgb), 0.3)
    );
    z-index: 1;
  }
}

.tab-header {
  display: flex;
  padding: 8px;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    color: var(--theme-text-muted);
    font-size: 11px;
    font-weight: 600;
    position: relative;
    overflow: hidden;

    .tab-icon {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      background: linear-gradient(
        135deg,
        var(--theme-text-muted),
        var(--theme-border)
      );
      transition: all 0.3s ease;
    }

    &:hover {
      background: rgba(var(--theme-background-rgb), 0.3);
      transform: translateY(-1px);
    }

    &.active {
      background: rgba(var(--theme-background-rgb), 0.6);
      color: var(--theme-text);
      box-shadow: 0 2px 8px rgba(var(--theme-primary-rgb), 0.2);

      .tab-icon {
        background: linear-gradient(
          135deg,
          var(--theme-primary) 0%,
          var(--theme-info) 100%
        );
      }
    }

    span {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
  }
}

.tab-content {
  flex: 1;
  overflow: hidden;

  .content-wrapper {
    height: 100%;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px) scale(0.98);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px) scale(0.98);
}

.p-dialog .p-dialog-content {
  padding: 0;
  background: transparent;
}
</style>
