<template>
  <div class="quick-input" keep-menu>
    <i class="pi pi-times close" @click="close"></i>
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
    <div class="tab-content-wrapper">
      <transition name="fade">
        <div v-if="activeTab === 0" key="0" class="tab-content">
          <CommonText />
        </div>
      </transition>
      <transition name="fade">
        <div v-if="activeTab === 1" key="1" class="tab-content">
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
  background-color: rgb(242, 244, 253);
  width: 210px;
  height: 330px;
  border-radius: 10px;
  z-index: 2;
  cursor: default;
  box-shadow:
    0 0 0 1px #a037371a,
    0 4px 11px rgba(0, 0, 0, 0.2);
}

.close {
  position: absolute;
  top: 5px;
  right: 5px;
  cursor: pointer;
}

.tabs {
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  margin: 0 20px;
  padding: 0 20px;
  border-bottom: 1px solid #ccc;
}

.tab {
  padding: 8px;
  cursor: pointer;
}

.tab.active {
  font-weight: bold;
  border-bottom: 2px solid #5295dd;
  /* 选中的 tab 下方边框 */
}

.tab-content-wrapper {
  position: relative;
  height: fit-content;
}

.tab-content {
  position: absolute;
  width: 100%;
  left: 0;
  top: 0;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
