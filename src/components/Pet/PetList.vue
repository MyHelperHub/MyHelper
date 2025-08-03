<template>
  <div class="pet-list-container">
    <!-- 主显示区域 -->
    <div class="main-display">
      <PetDisplay
        ref="petDisplayRef"
        :model-config="selectedModel"
        :width="displaySize.width"
        :height="displaySize.height"
        @loaded="onModelLoaded"
        @error="onModelError" />
    </div>

    <!-- 模型选择器 -->
    <div class="selector-section">
      <PetSelector
        ref="petSelectorRef"
        v-model="selectedModelIndex"
        @model-selected="onModelSelected" />
    </div>

    <!-- 控制面板 -->
    <div v-if="selectedModel && modelInfo" class="control-panel">
      <div class="model-info">
        <h4>{{ selectedModel.name }}</h4>
        <div class="info-stats">
          <span>动作组: {{ Object.keys(modelInfo.motions || {}).length }}</span>
          <span>表情: {{ (modelInfo.expressions || []).length }}</span>
        </div>
      </div>

      <div class="action-buttons">
        <button
          @click="playRandomMotion"
          class="action-btn"
          :disabled="!hasMotions">
          随机动作
        </button>
        <button
          @click="playRandomExpression"
          class="action-btn"
          :disabled="!hasExpressions">
          随机表情
        </button>
      </div>

      <!-- 缩放控制 -->
      <div class="scale-control">
        <label>缩放: {{ Math.round(modelScale * 100) }}%</label>
        <input
          v-model.number="modelScale"
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          @input="onScaleChange" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { ModelConfig, ModelInfo } from "@/interface/pet";
import PetDisplay from "./PetDisplay.vue";
import PetSelector from "./PetSelector.vue";

interface Props {
  displayWidth?: number;
  displayHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  displayWidth: 200,
  displayHeight: 200,
});

const emit = defineEmits<{
  "model-changed": [model: ModelConfig | null];
  "model-loaded": [modelInfo: ModelInfo];
  "model-error": [error: string];
}>();

// 组件引用
const petDisplayRef = ref<InstanceType<typeof PetDisplay>>();
const petSelectorRef = ref<InstanceType<typeof PetSelector>>();

// 状态
const selectedModelIndex = ref<number | null>(null);
const modelInfo = ref<ModelInfo | null>(null);
const modelScale = ref(0.8);

// 计算属性
const selectedModel = computed<ModelConfig | null>(() => {
  if (petSelectorRef.value && selectedModelIndex.value !== null) {
    const models = petSelectorRef.value.models();
    return models[selectedModelIndex.value] || null;
  }
  return null;
});

const displaySize = computed(() => ({
  width: props.displayWidth,
  height: props.displayHeight,
}));

const hasMotions = computed(() => {
  if (!modelInfo.value?.motions) return false;
  return Object.keys(modelInfo.value.motions).length > 0;
});

const hasExpressions = computed(() => {
  if (!modelInfo.value?.expressions) return false;
  return modelInfo.value.expressions.length > 0;
});

// 事件处理
const onModelSelected = (model: ModelConfig) => {
  console.log("PetList: 选择模型", model.name);
  emit("model-changed", model);
};

const onModelLoaded = (info: ModelInfo) => {
  console.log("PetList: 模型加载完成", info);
  modelInfo.value = info;

  // 重要：新模型加载后，等待一帧再同步缩放值，确保模型完全初始化
  nextTick(() => {
    if (petDisplayRef.value) {
      const currentScale = petDisplayRef.value.getModelScale();
      console.log("PetList: 同步缩放值", {
        ui: modelScale.value,
        model: currentScale,
      });

      // 如果UI缩放值与模型缩放值不同，以模型为准（新模型的默认缩放）
      if (Math.abs(modelScale.value - currentScale) > 0.01) {
        modelScale.value = currentScale;
      }
    }
  });

  emit("model-loaded", info);
};

const onModelError = (error: string) => {
  console.error("PetList: 模型加载失败", error);
  modelInfo.value = null;
  emit("model-error", error);
};

const onScaleChange = () => {
  if (petDisplayRef.value) {
    console.log("PetList: 用户调整缩放", modelScale.value);
    petDisplayRef.value.setModelScale(modelScale.value);
  }
};

// 播放随机动作
const playRandomMotion = () => {
  if (!petDisplayRef.value || !modelInfo.value?.motions) return;

  const motionGroups = Object.keys(modelInfo.value.motions);
  if (motionGroups.length === 0) return;

  const randomGroup =
    motionGroups[Math.floor(Math.random() * motionGroups.length)];
  const motions = modelInfo.value.motions[randomGroup];

  if (motions && motions.length > 0) {
    const randomIndex = Math.floor(Math.random() * motions.length);
    petDisplayRef.value.playMotion(randomGroup, randomIndex);
    console.log(`PetList: 播放动作 ${randomGroup}[${randomIndex}]`);
  }
};

// 播放随机表情
const playRandomExpression = () => {
  if (!petDisplayRef.value || !modelInfo.value?.expressions) return;

  const expressions = modelInfo.value.expressions;
  if (expressions.length === 0) return;

  const randomIndex = Math.floor(Math.random() * expressions.length);
  petDisplayRef.value.playExpression(randomIndex);
  console.log(`PetList: 播放表情 ${randomIndex}`);
};

// 刷新模型列表
const refreshModels = () => {
  if (petSelectorRef.value) {
    petSelectorRef.value.refreshModels();
  }
};

// 获取当前模型信息
const getCurrentModelInfo = () => {
  return modelInfo.value;
};

// 重新加载当前模型
const reloadCurrentModel = () => {
  if (petDisplayRef.value) {
    petDisplayRef.value.retryLoad();
  }
};

// 监听选中模型变化
watch(selectedModel, (newModel) => {
  emit("model-changed", newModel);
});

// 暴露给父组件的方法
defineExpose({
  refreshModels,
  getCurrentModelInfo,
  reloadCurrentModel,
  playRandomMotion,
  playRandomExpression,
  getSelectedModel: () => selectedModel.value,
});
</script>

<style scoped>
.pet-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
  max-width: 100%;
  font-size: 12px;
}

.main-display {
  display: flex;
  justify-content: center;
  align-items: center;
}

.selector-section {
  width: 100%;
}

/* 控制面板 */
.control-panel {
  background: var(--theme-background-secondary, #f8f9fa);
  border-radius: 6px;
  padding: 10px;
  border: 1px solid var(--theme-border, #e9ecef);
}

.model-info {
  margin-bottom: 10px;
  text-align: center;
}

.model-info h4 {
  margin: 0 0 6px 0;
  color: var(--theme-text, #333);
  font-size: 13px;
  font-weight: 500;
}

.info-stats {
  display: flex;
  gap: 8px;
  justify-content: center;
  font-size: 10px;
  color: var(--theme-text-secondary, #666);
}

.info-stats span {
  padding: 2px 6px;
  background: var(--theme-background, #fff);
  border-radius: 8px;
  border: 1px solid var(--theme-border, #e9ecef);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-bottom: 10px;
}

.action-btn {
  padding: 4px 8px;
  background: var(--theme-primary, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: all 0.3s;
  flex: 1;
  max-width: 60px;
}

.action-btn:hover:not(:disabled) {
  background: var(--theme-primary-hover, #0056b3);
  transform: translateY(-1px);
}

.action-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 缩放控制 */
.scale-control {
  text-align: center;
}

.scale-control label {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  color: var(--theme-text-secondary, #666);
  font-weight: 500;
}

.scale-control input[type="range"] {
  width: 100%;
  max-width: 120px;
  height: 3px;
  background: var(--theme-border, #e9ecef);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.scale-control input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--theme-primary, #007bff);
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s;
}

.scale-control input[type="range"]::-webkit-slider-thumb:hover {
  background: var(--theme-primary-hover, #0056b3);
}

.scale-control input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--theme-primary, #007bff);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s;
}

.scale-control input[type="range"]::-moz-range-thumb:hover {
  background: var(--theme-primary-hover, #0056b3);
}
</style>
