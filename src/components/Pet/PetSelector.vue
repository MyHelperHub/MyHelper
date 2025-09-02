<template>
  <div class="pet-selector">
    <div class="selector-header">
      <h4>选择宠物</h4>
      <span v-if="models.length" class="model-count"
        >{{ models.length }} 个模型</span
      >
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载模型列表中...</p>
    </div>

    <div v-else-if="models.length === 0" class="empty-state">
      <p>暂无可用模型</p>
      <button @click="refreshModels" class="refresh-btn">刷新</button>
    </div>

    <div v-else class="model-grid">
      <div
        v-for="(model, index) in models"
        :key="model.name"
        class="model-item"
        :class="{ selected: selectedIndex === index }"
        @click="selectModel(index)">
        <div class="model-preview">
          {{ getModelInitial(model.name) }}
        </div>
        <div class="model-info">
          <div class="model-name">{{ model.name }}</div>
          <div class="model-path">{{ getShortPath(model.path) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ModelConfig } from "@/composables/useLive2D";
import { createPetModelFactory } from "./models/PetModelFactory";
import {
  AssetsModelSource,
  DEFAULT_ASSETS_MODELS,
} from "./models/live2d/AssetsModelSource";

interface Props {
  modelValue?: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
  "model-selected": [model: ModelConfig, index: number];
  "models-loaded": [models: ModelConfig[]];
}>();

const models = ref<ModelConfig[]>([]);
const selectedIndex = ref<number | null>(props.modelValue || null);
const isLoading = ref(false);

const modelFactory = createPetModelFactory();

/** 初始化模型源 */
const initModelSources = () => {
  const assetsSource = new AssetsModelSource(DEFAULT_ASSETS_MODELS);
  modelFactory.registerModelSource("assets", assetsSource);
};

/** 加载模型列表 */
const loadModels = async () => {
  isLoading.value = true;
  try {
    const availableModels = await modelFactory.getAvailableModels();
    models.value = availableModels;

    emit("models-loaded", availableModels);

    if (
      selectedIndex.value !== null &&
      selectedIndex.value >= models.value.length
    ) {
      selectedIndex.value = null;
      emit("update:modelValue", null);
    }
  } catch (error) {
    console.error("加载模型列表失败:", error);
    models.value = [];
    emit("models-loaded", []);
  } finally {
    isLoading.value = false;
  }
};

/** 刷新模型列表 */
const refreshModels = () => {
  loadModels();
};

/** 选择模型 */
const selectModel = (index: number) => {
  if (index < 0 || index >= models.value.length) return;

  selectedIndex.value = index;
  const selectedModel = models.value[index];

  emit("update:modelValue", index);
  emit("model-selected", selectedModel, index);
};

/** 获取模型名称首字母 */
const getModelInitial = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

/** 获取简短路径 */
const getShortPath = (path: string): string => {
  const parts = path.split("/");
  return parts.length > 2 ? `.../${parts.slice(-2).join("/")}` : path;
};

/** 获取当前选中的模型 */
const getSelectedModel = (): ModelConfig | null => {
  if (
    selectedIndex.value === null ||
    selectedIndex.value >= models.value.length
  ) {
    return null;
  }
  return models.value[selectedIndex.value];
};

onMounted(() => {
  initModelSources();
  loadModels();
});

defineExpose({
  refreshModels,
  getSelectedModel,
  models: () => models.value,
});
</script>

<style scoped>
.pet-selector {
  padding: 8px;
  border-radius: 6px;
  background: var(--theme-background-secondary, #f8f9fa);
  border: 1px solid var(--theme-border, #e9ecef);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.selector-header h4 {
  margin: 0;
  font-size: 12px;
  color: var(--theme-text, #333);
  font-weight: 500;
}

.model-count {
  font-size: 9px;
  color: var(--theme-text-secondary, #666);
  background: var(--theme-background, #fff);
  padding: 1px 4px;
  border-radius: 8px;
}

.loading-state {
  text-align: center;
  padding: 12px;
  color: var(--theme-text-secondary, #666);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top: 2px solid var(--theme-primary, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 6px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 12px;
  color: var(--theme-text-secondary, #666);
  font-size: 11px;
}

.refresh-btn {
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--theme-primary, #007bff);
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 9px;
  transition: background 0.3s;
}

.refresh-btn:hover {
  background: var(--theme-primary-hover, #0056b3);
}

.model-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;
  background: var(--theme-background, #fff);
}

.model-item:hover {
  background: var(--theme-background-hover, #f0f8ff);
  transform: translateX(2px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.model-item.selected {
  border-color: var(--theme-primary, #007bff);
  background: var(--theme-primary-light, rgba(0, 123, 255, 0.1));
}

.model-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(
    45deg,
    var(--theme-primary, #007bff),
    var(--theme-primary-dark, #0056b3)
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 10px;
  flex-shrink: 0;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  font-weight: 500;
  color: var(--theme-text, #333);
  margin-bottom: 1px;
  word-break: break-word;
  font-size: 10px;
  line-height: 1.2;
}

.model-path {
  font-size: 8px;
  color: var(--theme-text-secondary, #666);
  word-break: break-all;
  line-height: 1.1;
}
</style>
