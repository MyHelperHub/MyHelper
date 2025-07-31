<template>
  <div class="pet-container">
    <canvas id="live2dCanvas" ref="live2dCanvas"></canvas>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载模型中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <button @click="retryLoad">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useLive2D, type ModelConfig } from "@/composables/useLive2D";

// 定义props
interface Props {
  modelConfig: ModelConfig;
}

const props = defineProps<Props>();

// 使用 Live2D composable
const {
  isLoading,
  error,
  modelInfo,
  loadModel,
  resize,
  playMotion,
  playExpression,
  destroy,
} = useLive2D();

// 组件状态
const live2dCanvas = ref<HTMLCanvasElement | null>(null);

// 加载模型
const loadCurrentModel = async () => {
  if (!live2dCanvas.value || !props.modelConfig) return;

  try {
    await loadModel(live2dCanvas.value, props.modelConfig);
  } catch (err) {
    console.error("模型加载失败:", props.modelConfig.name, err);
  }
};

// 重试加载
const retryLoad = () => {
  loadCurrentModel();
};

// 调整画布大小
const resizeCanvas = () => {
  if (!live2dCanvas.value) return;

  const canvas = live2dCanvas.value;
  const container = canvas.parentElement;

  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // 调整模型大小
    resize(canvas);
  }
};

// 窗口大小变化监听
let resizeObserver: ResizeObserver | null = null;

// 组件挂载
onMounted(async () => {
  await nextTick();
  resizeCanvas();
  await loadCurrentModel();

  // 使用 ResizeObserver 监听容器大小变化
  if (live2dCanvas.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(live2dCanvas.value.parentElement);
  }
});

// 组件卸载
onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  destroy();
});

// 暴露给父组件的方法
defineExpose({
  playMotion,
  playExpression,
  getModelInfo: () => modelInfo.value,
  retryLoad,
});
</script>

<style scoped>
.pet-container {
  width: 80px;
  height: 80px;
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.1);
}

#live2dCanvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  z-index: 20;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 错误状态 */
.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ff6b6b;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 8px;
  z-index: 20;
}

.error-overlay button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.error-overlay button:hover {
  background: #ff5252;
}
</style>
