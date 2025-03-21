<template>
  <div class="quick-input" keep-menu>
    <div class="quick-input-header">
      <h3 class="title">快捷输入</h3>
      <i class="pi pi-times close-icon" @click="close"></i>
    </div>
    <div class="tabs-container">
      <div class="tabs">
        <div
          class="tab"
          :class="{ active: activeTab === 0 }"
          @click="activeTab = 0">
          常用
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 1 }"
          @click="activeTab = 1">
          剪贴板
        </div>
      </div>
    </div>
    <div class="tab-content-wrapper">
      <transition name="slide-fade" mode="out-in">
        <div v-if="activeTab === 0" key="0" class="tab-content">
          <CommonText />
        </div>
        <div v-else key="1" class="tab-content">
          <Clipboard />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CommonText from "./CommonText.vue";
import Clipboard from "./Clipboard.vue";
import { emit } from "@/utils/eventBus";

/** 0为常用，1为剪贴板 */
const activeTab = ref(0);
const close = () => {
  emit("closeAllMenu");
};
</script>

<style lang="less">
.quick-input {
  position: absolute;
  top: -185px;
  left: -13px;
  background-color: rgb(248, 250, 255);
  width: 210px;
  height: 330px;
  border-radius: 12px;
  z-index: 2;
  cursor: default;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 10px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  animation: popup 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes popup {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.quick-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px 8px;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.close-icon {
  font-size: 14px;
  color: #777;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
    color: #333;
  }
}

.tabs-container {
  padding: 0 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 10px;
}

.tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  width: 100%;
}

.tab {
  position: relative;
  padding: 8px 0;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
  white-space: nowrap;

  &:hover {
    color: #4a85c9;
  }

  &.active {
    color: #4a85c9;
    font-weight: 500;

    &:after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 20%;
      width: 60%;
      height: 2px;
      background: #4a85c9;
      border-radius: 2px 2px 0 0;
      transition: all 0.3s ease;
    }
  }
}

.tab-content-wrapper {
  position: relative;
  height: calc(100% - 90px);
  overflow: hidden;
}

.tab-content {
  width: 100%;
  height: 100%;
  padding: 5px 15px;
}

/* 动画效果 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
