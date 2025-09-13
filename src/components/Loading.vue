// src/components/Loading.vue
<template>
  <transition name="fade">
    <div v-if="loadingCount > 0" class="loading-overlay">
      <!-- <div class="loading-spinner"></div> -->
      <ProgressSpinner
        style="width: 50px; height: 50px"
        strokeWidth="8"
        fill="transparent"
        animationDuration=".5s"
        aria-label="Custom ProgressSpinner" />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ProgressSpinner from "primevue/progressspinner";

/** loading计数器 */
const loadingCount = ref(0);

/** 显示加载状态 */
const showLoading = () => {
  loadingCount.value++;
};

/** 隐藏加载状态 */
const hideLoading = () => {
  loadingCount.value--;
  if (loadingCount.value < 0) {
    loadingCount.value = 0;
  }
};

defineExpose({ showLoading, hideLoading });
</script>

<style lang="less">
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(
    var(--theme-background-rgb),
    calc(var(--theme-transparency-background) - 0.4)
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--theme-radius-xl);
  border: 1px solid
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5000;
  transition: opacity 0.3s ease-in-out;

  .p-progress-spinner {
    color: var(--theme-primary);
  }

  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 2px solid var(--theme-primary);
    border-top-color: transparent;
    border-radius: 100%;
    animation: circle infinite 0.75s linear;
  }

  @keyframes circle {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
