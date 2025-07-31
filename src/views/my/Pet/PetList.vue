<template>
  <div class="pet-list-container">
    <!-- 单一的画布显示当前选中的模型 -->
    <div class="main-display">
      <canvas ref="mainCanvas" class="main-canvas"></canvas>

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

    <!-- 模型选择器 -->
    <div class="model-selector">
      <div
        v-for="(config, index) in allModels"
        :key="index"
        class="model-option"
        :class="{ selected: selectedModel === index }"
        @click="selectModel(index)">
        <div class="model-preview">{{ config.name.charAt(0) }}</div>
        <div class="model-name">{{ config.name }}</div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div
      v-if="selectedModel !== null && modelInfo && allModels[selectedModel]"
      class="control-panel">
      <div class="model-info">
        <h4>{{ allModels[selectedModel].name }}</h4>
        <p>动作组: {{ Object.keys(modelInfo.motions || {}).length }}</p>
        <p>表情: {{ (modelInfo.expressions || []).length }}</p>
      </div>
      <div class="action-buttons">
        <button @click="playRandomMotion" class="action-btn">随机动作</button>
        <button @click="playRandomExpression" class="action-btn">
          随机表情
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import {
  useLive2D,
  getAllModels,
  type ModelConfig,
} from "@/composables/useLive2D";

// 使用单一的 Live2D composable
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

// 状态
const allModels = ref<ModelConfig[]>([]);
const selectedModel = ref<number | null>(null);
const mainCanvas = ref<HTMLCanvasElement | null>(null);

// 加载所有模型配置
onMounted(async () => {
  allModels.value = getAllModels();

  // 默认选择第一个模型
  if (allModels.value.length > 0) {
    selectedModel.value = 0;
    await nextTick();
    await loadCurrentModel();
  }

  // 设置画布大小
  resizeCanvas();
});

// 加载当前选中的模型
const loadCurrentModel = async () => {
  if (!mainCanvas.value || selectedModel.value === null) {
    return;
  }

  const config = allModels.value[selectedModel.value];
  if (!config) {
    return;
  }

  try {
    await loadModel(mainCanvas.value, config);
  } catch (err) {
    console.error("模型加载失败:", config.name, err);
  }
};

// 选择模型
const selectModel = async (index: number) => {
  if (selectedModel.value === index) {
    return;
  }

  selectedModel.value = index;
  await loadCurrentModel();
};

// 重试加载
const retryLoad = () => {
  loadCurrentModel();
};

// 调整画布大小
const resizeCanvas = () => {
  if (!mainCanvas.value) return;

  const canvas = mainCanvas.value;
  const container = canvas.parentElement;

  if (container) {
    // 设置固定大小
    canvas.width = 120;
    canvas.height = 120;
    canvas.style.width = "120px";
    canvas.style.height = "120px";

    // 调整模型大小
    resize(canvas);
  }
};

// 播放随机动作
const playRandomMotion = () => {
  if (!modelInfo.value || !modelInfo.value.motions) return;

  const motionGroups = Object.keys(modelInfo.value.motions);
  if (motionGroups.length > 0) {
    const randomGroup =
      motionGroups[Math.floor(Math.random() * motionGroups.length)];
    const motions = modelInfo.value.motions[randomGroup];
    if (motions && motions.length > 0) {
      const randomIndex = Math.floor(Math.random() * motions.length);
      playMotion(randomGroup, randomIndex);
    }
  }
};

// 播放随机表情
const playRandomExpression = () => {
  if (!modelInfo.value || !modelInfo.value.expressions) return;

  const expressions = modelInfo.value.expressions;
  if (expressions.length > 0) {
    const randomIndex = Math.floor(Math.random() * expressions.length);
    playExpression(randomIndex);
  }
};

// 组件卸载
onUnmounted(() => {
  destroy();
});
</script>

<style scoped>
.pet-list-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
}

.main-display {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.main-canvas {
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
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 5px;
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
  padding: 10px;
  border-radius: 4px;
  z-index: 20;
  font-size: 12px;
}

.error-overlay button {
  margin-top: 5px;
  padding: 4px 8px;
  background: #ff6b6b;
  color: white;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  font-size: 10px;
}

/* 模型选择器 */
.model-selector {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.model-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.model-option:hover {
  background: rgba(0, 0, 0, 0.1);
}

.model-option.selected {
  border-color: #007bff;
  background: rgba(0, 123, 255, 0.1);
}

.model-preview {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(45deg, #007bff, #0056b3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.model-name {
  font-size: 12px;
  text-align: center;
  color: var(--theme-text);
  max-width: 60px;
  word-break: break-all;
}

/* 控制面板 */
.control-panel {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.model-info {
  margin-bottom: 10px;
}

.model-info h4 {
  margin: 0 0 5px 0;
  color: var(--theme-text);
  font-size: 14px;
}

.model-info p {
  margin: 2px 0;
  font-size: 11px;
  color: var(--theme-text-secondary);
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-btn {
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.action-btn:hover {
  background: #0056b3;
}

.action-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
