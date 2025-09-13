<template>
  <div class="pet-display-container">
    <canvas ref="canvasRef" class="pet-canvas" />

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载模型中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <button @click="loadModel" class="retry-btn">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import type { ModelConfig, ModelInfo } from "@/interface/pet";
import { SimpleLive2DManager } from "./SimpleLive2DManager";
import { Logger } from "@/utils/logger";

interface Props {
  width?: number;
  height?: number;
  modelConfig: ModelConfig | null;
}

const props = withDefaults(defineProps<Props>(), {
  width: 120,
  height: 120,
});

const emit = defineEmits<{
  loaded: [modelInfo: ModelInfo];
  error: [error: string];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const isLoading = ref(false);
const error = ref<string | null>(null);
const modelInfo = ref<ModelInfo | null>(null);

// 使用简化的Live2D管理器
let modelManager: SimpleLive2DManager | null = null;
let loadingPromise: Promise<void> | null = null;

const loadModel = async () => {
  if (!canvasRef.value || !props.modelConfig) return;

  if (loadingPromise) {
    await loadingPromise.catch(() => {});
  }

  loadingPromise = performModelLoad();

  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
};

const performModelLoad = async (): Promise<void> => {
  if (!canvasRef.value || !props.modelConfig) {
    throw new Error("Canvas或模型配置不可用");
  }

  isLoading.value = true;
  error.value = null;

  try {
    // 销毁旧模型但保留管理器实例
    if (modelManager) {
      modelManager.destroyModel();
    } else {
      modelManager = new SimpleLive2DManager();
    }

    setupCanvas();
    await nextTick();

    const info = await modelManager.load(canvasRef.value, props.modelConfig);

    if (info) {
      modelInfo.value = info;
      await nextTick();
      modelManager.resize(canvasRef.value);
      emit("loaded", info);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "加载模型失败";
    error.value = errorMsg;
    emit("error", errorMsg);
    Logger.error("PetDisplay: 模型加载失败", errorMsg);
    throw err; // 重新抛出错误以便上层处理
  } finally {
    isLoading.value = false;
  }
};

/** 设置画布 */
const setupCanvas = () => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const width = props.width || 160;
  const height = props.height || 160;

  // 直接设置画布尺寸，不考虑设备像素比的复杂处理
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
};

/** 播放动作 */
const playMotion = (group: string, index: number) => {
  return modelManager?.playMotion(group, index);
};

/** 播放表情 */
const playExpression = (index: number) => {
  return modelManager?.playExpression(index);
};

/** 设置模型缩放 */
const setModelScale = (scale: number) => {
  modelManager?.setModelScale(scale);
};

/** 获取模型缩放 */
const getModelScale = () => {
  return modelManager?.getModelScale() || 1;
};

// 监听props.modelConfig变化
watch(
  () => props.modelConfig,
  async (newModel) => {
    if (newModel) {
      await loadModel();
    }
  },
  { immediate: false },
);

watch([() => props.width, () => props.height], () => {
  if (!modelManager || !canvasRef.value) return;
  setupCanvas();
  modelManager.resize(canvasRef.value);
});

onMounted(async () => {
  await nextTick();
  if (canvasRef.value && props.modelConfig) {
    await loadModel();
  }
});

onUnmounted(() => {
  // 取消正在进行的加载
  if (loadingPromise) {
    loadingPromise = null;
  }

  if (modelManager) {
    // 完全销毁管理器实例
    modelManager.destroy();
    modelManager = null;
  }
});

defineExpose({
  loadModel,
  playMotion,
  playExpression,
  setModelScale,
  getModelScale,
});
</script>

<style lang="less">
.pet-display-container {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;

  .pet-canvas {
    display: block;
  }

  .loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--theme-text);
    z-index: 20;

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid
        rgba(var(--theme-border-rgb), var(--theme-transparency-border));
      border-top: 3px solid var(--theme-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 8px;
    }
  }

  .error-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--theme-error);
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    padding: 12px;
    border-radius: 6px;
    z-index: 20;
    font-size: 12px;

    .retry-btn {
      margin-top: 8px;
      padding: 6px 12px;
      background: var(--theme-error);
      color: var(--theme-background);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: background 0.3s;

      &:hover {
        background: var(--theme-error);
      }
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
}
</style>
