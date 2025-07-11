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

const loadingCount = ref(0);

const showLoading = () => {
  loadingCount.value++;
};

const hideLoading = () => {
  loadingCount.value--;
  // 保证 loadingCount 始终不小于 0
  if (loadingCount.value < 0) {
    loadingCount.value = 0;
  }
};

defineExpose({ showLoading, hideLoading });
</script>

<style lang="less" scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5000;
  transition: opacity 0.3s ease-in-out;

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
