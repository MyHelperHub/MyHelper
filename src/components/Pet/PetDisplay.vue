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
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import type { ModelConfig, ModelInfo, PetModelManager } from "@/interface/pet";
import { PetModelFactory } from "./models/PetModelFactory";

interface Props {
  modelConfig?: ModelConfig | null;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelConfig: null,
  width: 120,
  height: 120,
});

const emit = defineEmits<{
  loaded: [modelInfo: ModelInfo];
  error: [error: string];
}>();

// 状态
const canvasRef = ref<HTMLCanvasElement>();
const isLoading = ref(false);
const error = ref<string | null>(null);
const modelInfo = ref<ModelInfo | null>(null);

// 模型管理器
let modelManager: PetModelManager | null = null;
const modelFactory = PetModelFactory.getInstance();

// 加载模型
const loadModel = async () => {
  if (!canvasRef.value || !props.modelConfig) return;

  isLoading.value = true;
  error.value = null;

  try {
    // 销毁旧模型，但不销毁应用
    if (modelManager) {
      modelManager.destroy();
      modelManager = null;
    }

    setupCanvas();
    await nextTick();

    // 创建新管理器并加载
    modelManager = modelFactory.createModelManager("live2d");
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
  } finally {
    isLoading.value = false;
  }
};

// 重试加载
const retryLoad = () => {
  loadModel();
};

// 设置画布
const setupCanvas = () => {
  if (!canvasRef.value) {
    return;
  }

  const canvas = canvasRef.value;

  // 设置画布的实际尺寸和显示尺寸
  canvas.width = props.width;
  canvas.height = props.height;
  canvas.style.width = `${props.width}px`;
  canvas.style.height = `${props.height}px`;

  // 确保像素比正确
  const dpr = window.devicePixelRatio || 1;
  if (dpr !== 1) {
    canvas.width = props.width * dpr;
    canvas.height = props.height * dpr;
    canvas.style.width = `${props.width}px`;
    canvas.style.height = `${props.height}px`;
  }
};

// 调整大小
const resize = () => {
  if (!modelManager || !canvasRef.value) return;

  setupCanvas();
  modelManager.resize(canvasRef.value);
};

// 播放动作
const playMotion = (group: string, index: number) => {
  return modelManager?.playMotion(group, index);
};

// 播放表情
const playExpression = (index: number) => {
  return modelManager?.playExpression(index);
};

// 设置模型缩放
const setModelScale = (scale: number) => {
  modelManager?.setModelScale(scale);
};

// 获取模型缩放
const getModelScale = () => {
  return modelManager?.getModelScale() || 1;
};

// 检查模型是否有效
const isModelValid = () => {
  return modelManager?.isModelValid() || false;
};

// 监听模型配置变化
watch(
  () => props.modelConfig,
  async (newConfig) => {
    if (newConfig) {
      await loadModel();
    }
  },
);

// 监听尺寸变化
watch([() => props.width, () => props.height], () => {
  resize();
});

// 组件挂载
onMounted(async () => {
  // 等待DOM完全渲染
  await nextTick();

  // 确保画布存在且有正确尺寸
  if (canvasRef.value) {
    // 如果有模型配置，立即加载
    if (props.modelConfig) {
      await loadModel();
    } else {
    }
  } else {
    console.error("PetDisplay: 画布元素不存在");
  }
});

// 组件卸载
onUnmounted(() => {
  if (modelManager) {
    modelManager.destroy();
    modelManager = null;
  }
});

// 暴露给父组件的方法
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
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.pet-canvas {
  display: block;
}

/* 加载状态 */
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

/* 错误状态 */
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
