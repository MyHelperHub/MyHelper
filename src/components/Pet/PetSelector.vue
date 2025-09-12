<template>
  <div class="pet-selector">
    <ConfirmDialog></ConfirmDialog>
    
    <DataView 
      :value="models" 
      :loading="isLoading"
      layout="list"
      class="model-dataview">
      
      <!-- 头部模板 -->
      <template #header>
        <div class="selector-header">
          <h4>选择宠物</h4>
          <span v-if="models.length" class="model-count">
            {{ models.length }} 个模型
          </span>
        </div>
      </template>

      <!-- 空状态模板 -->
      <template #empty>
        <div class="empty-state">
          <i class="pi pi-box empty-icon"></i>
          <p>暂无可用模型</p>
          <Button 
            @click="refreshModels" 
            label="刷新" 
            icon="pi pi-refresh"
            size="small" 
            outlined />
        </div>
      </template>

      <!-- 列表项模板 -->
      <template #list="slotProps">
        <div 
          v-for="(model, index) in slotProps.items"
          :key="index"
          class="model-item"
          :class="{ selected: selectedIndex === index }"
          @click="selectModel(index)">
          
          <!-- 模型预览头像 -->
          <div class="model-avatar-container">
            <Avatar 
              :label="getModelInitial(model.name)"
              class="model-avatar"
              :class="{ 'user-model': model.source === 1 }"
              size="normal" />
            <div class="avatar-badge">
              <i v-if="model.source === 0" class="pi pi-star-fill builtin-badge"></i>
              <i v-else class="pi pi-user user-badge"></i>
            </div>
          </div>

          <!-- 模型信息 -->
          <div class="model-info">
            <div class="model-name">
              {{ model.name }}
              <Tag v-if="model.source === 0" value="内置" severity="warning" />
              <Tag v-if="model.version" :value="formatVersion(model.version)" severity="info" />
            </div>
            
            <div class="model-path">{{ getShortPath(model.path) }}</div>
            
            <div v-if="model.source === 1 && (model.size || model.importTime)" 
                 class="model-extra-info">
              <Chip v-if="model.size" class="info-chip">
                <template #icon>
                  <i class="pi pi-database"></i>
                </template>
                {{ formatFileSize(model.size) }}
              </Chip>
              <Chip v-if="model.importTime" class="info-chip">
                <template #icon>
                  <i class="pi pi-calendar"></i>
                </template>
                {{ formatImportTime(model.importTime) }}
              </Chip>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div v-if="model.source === 1" class="model-actions">
            <Button 
              @click.stop="deleteUserModel(model)"
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              :loading="isDeletingModel"
              v-tooltip="'删除模型'" />
          </div>
        </div>
      </template>
    </DataView>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";
import DataView from "primevue/dataview";
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import Tag from "primevue/tag";
import Chip from "primevue/chip";
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
const confirm = useConfirm();

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
        (m) =>
          m.name === currentSelectedModel.name &&
          m.path === currentSelectedModel.path,
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
const deleteUserModel = async (model: ModelConfig) => {
  if (model.source !== 1) {
    Logger.warn("PetSelector: 尝试删除非用户模型", model.name);
    return;
  }

  confirm.require({
    message: `确定要删除模型 "${model.name}" 吗？此操作不可撤销。`,
    header: "删除确认",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "取消",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "删除",
      severity: "danger",
    },
    accept: async () => {
      isDeletingModel.value = true;
      try {
        await PetGlobalManager.deleteUserModel(model.name);

        // 刷新模型列表
        await refreshModels();

        // 删除后选择第一个模型
        if (models.value.length > 0) {
          selectedIndex.value = 0;
          emit("update:modelValue", 0);
          emit("model-selected", models.value[0], 0);
        } else {
          selectedIndex.value = null;
          emit("update:modelValue", null);
        }

        Logger.info("PetSelector: 模型删除成功", model.name);
      } catch (error) {
        Logger.error(
          "PetSelector: 删除模型失败",
          `模型: ${model.name}, 错误: ${error}`,
        );
        alert(`删除模型失败: ${error}`);
      } finally {
        isDeletingModel.value = false;
      }
    },
    reject: () => {
      return;
    },
  });
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
    case "2.1":
      return "v2.1";
    case "3.x":
      return "v3.x";
    case "4.x":
      return "v4.x";
    default:
      return version;
  }
};

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return "未知";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
};

/** 格式化导入时间 */
const formatImportTime = (importTime: string): string => {
  try {
    const date = new Date(importTime);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    return "未知时间";
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

<style lang="less">
.pet-selector {
  border-radius: 8px;
  background: rgba(var(--theme-background-card-rgb), var(--theme-transparency-card));
  border: 1px solid rgba(var(--theme-border-rgb), var(--theme-transparency-border));

  :deep(.model-dataview) {
    border: none;
    background: transparent;

    .p-dataview-header {
      border: none;
      background: transparent;
      padding: 12px 12px 8px 12px;
    }

    .p-dataview-content {
      border: none;
      background: transparent;
      padding: 0 8px 8px 8px;
    }
  }

  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h4 {
      margin: 0;
      font-size: 14px;
      color: var(--theme-text);
      font-weight: 600;
    }
  }

  .model-count {
    font-size: 11px;
    color: var(--theme-text-muted);
    background: rgba(var(--theme-background-secondary-rgb), var(--theme-transparency-background-secondary));
    padding: 2px 6px;
    border-radius: 12px;
    font-weight: 500;
  }

  .empty-state {
    text-align: center;
    padding: 24px;
    color: var(--theme-text-muted);

    .empty-icon {
      font-size: 32px;
      color: var(--theme-text-secondary);
      margin-bottom: 12px;
    }

    p {
      margin: 0 0 16px 0;
      font-size: 14px;
    }
  }

  .model-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    background: rgba(var(--theme-background-card-rgb), var(--theme-transparency-card));
    margin-bottom: 4px;

    &:hover {
      background: rgba(var(--theme-background-secondary-rgb), var(--theme-transparency-background-secondary));
      transform: translateY(-1px);
      box-shadow: var(--theme-shadow-sm);
    }

    &.selected {
      border-color: var(--theme-primary);
      background: rgba(var(--theme-primary-rgb), 0.1);
      box-shadow: 0 0 0 1px var(--theme-primary);

      .model-path {
        color: var(--theme-text);
        opacity: 0.8;
      }

      :deep(.info-chip) {
        background: rgba(var(--theme-background-secondary-rgb), var(--theme-transparency-background-secondary));
        color: var(--theme-text);
      }
    }

    .model-avatar-container {
      position: relative;
      flex-shrink: 0;

      :deep(.model-avatar) {
        width: 40px;
        height: 40px;
        font-size: 16px;
        font-weight: 600;
        background: linear-gradient(45deg, var(--theme-primary), var(--theme-primary-dark));
        color: var(--theme-background);

        &.user-model {
          background: linear-gradient(45deg, var(--theme-success), var(--theme-success));
        }
      }

      .avatar-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: rgba(var(--theme-background-card-rgb), var(--theme-transparency-card));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        border: 2px solid rgba(var(--theme-border-rgb), var(--theme-transparency-border));

        .builtin-badge {
          color: var(--theme-warning);
        }

        .user-badge {
          color: var(--theme-text-secondary);
        }
      }
    }

    .model-info {
      flex: 1;
      min-width: 0;

      .model-name {
        font-weight: 600;
        color: var(--theme-text);
        margin-bottom: 4px;
        word-break: break-word;
        font-size: 13px;
        line-height: 1.3;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;

        :deep(.p-tag) {
          font-size: 9px;
          padding: 2px 6px;
          font-weight: 500;
        }
      }

      .model-path {
        font-size: 11px;
        color: var(--theme-text-muted);
        word-break: break-all;
        line-height: 1.2;
        margin-bottom: 4px;
      }

      .model-extra-info {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        :deep(.info-chip) {
          font-size: 9px;
          padding: 2px 6px;
          background: rgba(var(--theme-background-secondary-rgb), var(--theme-transparency-background-secondary));
          color: var(--theme-text-muted);

          i {
            font-size: 8px;
            margin-right: 3px;
            opacity: 0.8;
          }
        }
      }
    }

    .model-actions {
      flex-shrink: 0;

      :deep(.p-button) {
        width: 28px;
        height: 28px;
      }
    }
  }
}
</style>