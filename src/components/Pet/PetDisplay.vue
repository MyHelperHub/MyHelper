<template>
  <div class="pet-display-container">
    <canvas ref="canvasRef" class="pet-canvas" />

    <!-- 错误提示 -->
    <div v-if="error" class="error-overlay">
      <p>{{ error }}</p>
      <button @click="loadModel" class="retry-btn">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  nextTick,
  watch,
} from "vue";
import type { ModelConfig, ModelInfo } from "@/types/pet";
import { SimpleLive2DManager } from "./SimpleLive2DManager";
import { Logger } from "@/utils/logger";

type Props = {
  width?: number;
  height?: number;
  modelConfig: ModelConfig | null;
};

const props = withDefaults(defineProps<Props>(), {
  width: 120,
  height: 120,
});

const emit = defineEmits<{
  loaded: [modelInfo: ModelInfo];
  error: [error: string];
}>();

const canvasRef = ref<HTMLCanvasElement>();
const error = ref<string | null>(null);

let modelManager: SimpleLive2DManager | null = null;
let abortController: AbortController | null = null;

const loadModel = async () => {
  if (!canvasRef.value || !props.modelConfig) return;

  // 取消之前的加载
  abortController?.abort();
  abortController = new AbortController();
  error.value = null;

  try {
    setupCanvas();
    await nextTick();

    if (!modelManager) {
      modelManager = new SimpleLive2DManager();
    }

    const info = await modelManager.load(
      canvasRef.value,
      props.modelConfig,
      abortController.signal,
    );

    if (info) {
      await nextTick();
      modelManager.resize(canvasRef.value);
      emit("loaded", info);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;

    const errorMsg = err instanceof Error ? err.message : "加载模型失败";
    error.value = errorMsg;
    emit("error", errorMsg);
    Logger.error("PetDisplay: 模型加载失败", errorMsg);
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

watch([() => props.width, () => props.height], async () => {
  if (!modelManager || !canvasRef.value) return;
  setupCanvas();
  await nextTick();
  modelManager.resize(canvasRef.value);
});

onMounted(async () => {
  // 确保 canvas 尺寸在加载模型前正确设置
  if (canvasRef.value) {
    setupCanvas();
  }
  await nextTick();
  if (canvasRef.value && props.modelConfig) {
    await loadModel();
  }
});

/** 组件从 KeepAlive 缓存恢复时 */
onActivated(async () => {
  if (modelManager) {
    modelManager.resume();
  } else if (canvasRef.value && props.modelConfig) {
    await loadModel();
  }
});

/** 组件被 KeepAlive 缓存时 */
onDeactivated(() => {
  if (modelManager) {
    modelManager.pause();
  }
});

onUnmounted(() => {
  abortController?.abort();
  abortController = null;
  modelManager?.destroy();
  modelManager = null;
});

/** 外部调用的销毁方法（暂停并清理模型，但保留管理器） */
const destroy = () => {
  abortController?.abort();
  modelManager?.pause();
  modelManager?.destroyModel();
};

defineExpose({
  loadModel,
  playMotion,
  playExpression,
  setModelScale,
  getModelScale,
  destroy,
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
        opacity: 0.9;
      }
    }
  }
}
</style>
