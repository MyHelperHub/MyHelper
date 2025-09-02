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
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import type { ModelConfig, ModelInfo, PetModelManager } from "@/interface/pet";
import { createPetModelFactory } from "./models/PetModelFactory";
import { petManager } from "./petManager";
import { Logger } from "@/utils/logger";

interface Props {
  width?: number;
  height?: number;
  modelConfig?: ModelConfig | null; // 保留 props 但设为可选
}

const props = withDefaults(defineProps<Props>(), {
  width: 120,
  height: 120,
  modelConfig: null,
});

const emit = defineEmits<{
  loaded: [modelInfo: ModelInfo];
  error: [error: string];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const isLoading = ref(false);
const error = ref<string | null>(null);
const modelInfo = ref<ModelInfo | null>(null);

// 获取当前模型配置：优先使用 props，否则使用全局状态
const selectedModel = petManager.getSelectedModelRef();
const preferences = petManager.getPreferencesRef();

const currentModel = computed(() => {
  return props.modelConfig || selectedModel.value;
});

let modelManager: PetModelManager | null = null;
const modelFactory = createPetModelFactory();

const loadModel = async () => {
  if (!canvasRef.value || !currentModel.value) return;
  if (!preferences.value?.isEnabledPet && !props.modelConfig) return;

  isLoading.value = true;
  error.value = null;

  try {
    if (modelManager) {
      modelManager.destroy();
      modelManager = null;
    }

    setupCanvas();
    await nextTick();

    const manager = modelFactory.createModelManager("live2d");
    if (!manager) {
      throw new Error("创建模型管理器失败");
    }
    modelManager = manager;
    const info = await modelManager.load(canvasRef.value, currentModel.value);

    if (info) {
      modelInfo.value = info;
      await nextTick();
      modelManager.resize(canvasRef.value);
      emit("loaded", info);
      Logger.info("PetDisplay: 模型加载成功", currentModel.value.name);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "加载模型失败";
    error.value = errorMsg;
    emit("error", errorMsg);
    Logger.error("PetDisplay: 模型加载失败", errorMsg);
  } finally {
    isLoading.value = false;
  }
};

/** 重试加载 */
const retryLoad = () => {
  loadModel();
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

/** 调整大小 */
const resize = () => {
  if (!modelManager || !canvasRef.value) return;

  setupCanvas();
  modelManager.resize(canvasRef.value);
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

/** 检查模型是否有效 */
const isModelValid = () => {
  return modelManager?.isModelValid() || false;
};

// 监听模型变化
watch(
  currentModel,
  async (newModel) => {
    if (newModel) {
      await loadModel();
    }
  },
  { immediate: false }
);

watch([() => props.width, () => props.height], () => {
  resize();
});

onMounted(async () => {
  await nextTick();
  await petManager.init();

  if (canvasRef.value && currentModel.value) {
    await loadModel();
  }
});

onUnmounted(() => {
  if (modelManager) {
    modelManager.destroy();
    modelManager = null;
  }
});

defineExpose({
  loadModel,
  retryLoad,
  playMotion,
  playExpression,
  setModelScale,
  getModelScale,
  isModelValid,
  resize,
  modelInfo: () => modelInfo.value,
});
</script>

<style scoped>
.pet-display-container {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  /* background: rgba(0, 0, 0, 0.05); */
  overflow: hidden;
}

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
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid var(--theme-primary, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 8px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #ff6b6b;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px;
  border-radius: 6px;
  z-index: 20;
  font-size: 12px;
}

.retry-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.3s;
}

.retry-btn:hover {
  background: #ff5252;
}
</style>
