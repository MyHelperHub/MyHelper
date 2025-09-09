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
        <div class="model-preview" :class="{ 'user-model': model.source === 1 }">
          {{ getModelInitial(model.name) }}
          <div v-if="model.source === 0" class="builtin-indicator">
            <i class="pi pi-star-fill"></i>
          </div>
          <div v-else class="user-indicator">
            <i class="pi pi-user"></i>
          </div>
        </div>
        <div class="model-info">
          <div class="model-name">
            {{ model.name }}
            <span v-if="model.source === 0" class="builtin-badge">内置</span>
            <span v-if="model.version" class="version-badge">{{ formatVersion(model.version) }}</span>
          </div>
          <div class="model-path">{{ getShortPath(model.path) }}</div>
          <div v-if="model.source === 1 && (model.size || model.importTime)" class="model-extra-info">
            <span v-if="model.size" class="info-item">
              <i class="pi pi-database"></i>
              {{ formatFileSize(model.size) }}
            </span>
            <span v-if="model.importTime" class="info-item">
              <i class="pi pi-calendar"></i>
              {{ formatImportTime(model.importTime) }}
            </span>
          </div>
        </div>
        <div v-if="model.source === 1" class="model-actions">
          <button
            @click.stop="deleteUserModel(model, index)"
            class="delete-btn"
            :disabled="isDeletingModel"
            title="删除模型">
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ModelConfig } from "@/interface/pet";
import { PetGlobalManager } from "./PetGlobalManager";
import { Logger } from "@/utils/logger";

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
const isDeletingModel = ref(false);

/** 加载模型列表 */
const loadModels = async () => {
  isLoading.value = true;
  try {
    // 首先尝试从缓存获取，如果没有则刷新缓存
    let availableModels = await PetGlobalManager.getModelCache();
    if (availableModels.length === 0) {
      availableModels = await PetGlobalManager.refreshModelCache();
    }
    
    models.value = availableModels;
    emit("models-loaded", availableModels);

    // 加载完成后，同步全局选中的模型
    const currentSelectedModel = await PetGlobalManager.getSelectedModel();
    if (currentSelectedModel) {
      const index = availableModels.findIndex(
        (m) => m.name === currentSelectedModel.name && m.path === currentSelectedModel.path
      );
      if (index !== -1) {
        selectedIndex.value = index;
        emit("update:modelValue", index);
      }
    }

    // 确保选中索引有效
    if (
      selectedIndex.value !== null &&
      selectedIndex.value >= models.value.length
    ) {
      selectedIndex.value = null;
      emit("update:modelValue", null);
    }
  } catch (error) {
    Logger.error("PetSelector: 加载模型列表失败", String(error));
    models.value = [];
    emit("models-loaded", []);
  } finally {
    isLoading.value = false;
  }
};

/** 刷新模型列表 */
const refreshModels = async () => {
  isLoading.value = true;
  try {
    // 强制刷新缓存
    const availableModels = await PetGlobalManager.refreshModelCache();
    models.value = availableModels;
    emit("models-loaded", availableModels);
  } catch (error) {
    Logger.error("PetSelector: 刷新模型列表失败", String(error));
  } finally {
    isLoading.value = false;
  }
};

/** 选择模型 */
const selectModel = (index: number) => {
  if (index < 0 || index >= models.value.length) return;

  selectedIndex.value = index;
  const selectedModel = models.value[index];

  emit("update:modelValue", index);
  emit("model-selected", selectedModel, index);
};

/** 删除用户模型 */
const deleteUserModel = async (model: ModelConfig, index: number) => {
  if (model.source !== 1) {
    Logger.warn("PetSelector: 尝试删除非用户模型", model.name);
    return;
  }

  const confirmDelete = confirm(`确定要删除模型 "${model.name}" 吗？此操作不可撤销。`);
  if (!confirmDelete) return;

  isDeletingModel.value = true;
  try {
    await PetGlobalManager.deleteUserModel(model.name);
    
    // 如果删除的是当前选中的模型，清除选中状态
    if (selectedIndex.value === index) {
      selectedIndex.value = null;
      emit("update:modelValue", null);
    } else if (selectedIndex.value !== null && selectedIndex.value > index) {
      // 如果选中的是后面的模型，需要调整索引
      selectedIndex.value--;
      emit("update:modelValue", selectedIndex.value);
    }

    // 刷新模型列表
    await refreshModels();
    
    Logger.info("PetSelector: 模型删除成功", model.name);
  } catch (error) {
    Logger.error("PetSelector: 删除模型失败", `模型: ${model.name}, 错误: ${error}`);
    alert(`删除模型失败: ${error}`);
  } finally {
    isDeletingModel.value = false;
  }
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

/** 格式化版本信息 */
const formatVersion = (version: string): string => {
  switch (version) {
    case '2.1': return 'v2.1';
    case '3.x': return 'v3.x';
    case '4.x': return 'v4.x';
    default: return version;
  }
};

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '未知';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
};

/** 格式化导入时间 */
const formatImportTime = (importTime: string): string => {
  try {
    const date = new Date(importTime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return '未知时间';
  }
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
  position: relative;
}

.model-preview.user-model {
  background: linear-gradient(45deg, #28a745, #20692f);
}

.builtin-indicator,
.user-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6px;
  border: 1px solid var(--theme-border, #e9ecef);
}

.builtin-indicator {
  color: #ffc107;
}

.user-indicator {
  color: #6c757d;
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
  display: flex;
  align-items: center;
  gap: 4px;
}

.builtin-badge {
  font-size: 7px;
  padding: 1px 3px;
  background: #ffc107;
  color: #000;
  border-radius: 6px;
  font-weight: 600;
}

.version-badge {
  font-size: 7px;
  padding: 1px 3px;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  font-weight: 500;
}

.model-path {
  font-size: 8px;
  color: var(--theme-text-secondary, #666);
  word-break: break-all;
  line-height: 1.1;
  margin-bottom: 2px;
}

.model-extra-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 7px;
  color: var(--theme-text-secondary, #666);
  background: var(--theme-background-secondary, #f8f9fa);
  padding: 1px 3px;
  border-radius: 4px;
}

.info-item i {
  font-size: 6px;
  opacity: 0.7;
}

.model-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.delete-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  transition: all 0.2s;
}

.delete-btn:hover:not(:disabled) {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
