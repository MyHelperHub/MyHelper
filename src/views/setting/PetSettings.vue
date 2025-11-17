<template>
  <div class="pet-settings">
    <div class="settings-header">
      <h2>宠物设置</h2>
      <p class="settings-description">配置您的桌面宠物显示和行为</p>
    </div>

    <div class="settings-content">
      <!-- 宠物启用开关 -->
      <div class="setting-section">
        <div class="setting-item">
          <div class="setting-label">
            <h3>启用桌面宠物</h3>
            <p>在桌面显示Live2D宠物角色</p>
          </div>
          <div class="setting-control">
            <ToggleSwitch v-model="petEnabled" />
          </div>
        </div>
      </div>

      <!-- 宠物选择区域 -->
      <div class="setting-section">
        <div class="section-header">
          <div class="section-title">
            <h3>选择宠物</h3>
            <p>从可用模型中选择您喜欢的宠物</p>
          </div>
          <div class="section-actions">
            <Button
              icon="pi pi-upload"
              label="导入模型"
              size="small"
              outlined
              @click="showImportDialog = true" />
          </div>
        </div>

        <div class="pet-selection-area">
          <div class="pet-preview-section">
            <div class="preview-container">
              <PetDisplay
                ref="previewDisplayRef"
                :model-config="previewModel"
                :width="80"
                :height="80"
                @loaded="onPreviewLoaded"
                @error="onPreviewError" />
            </div>

            <div v-if="previewModel" class="model-info">
              <h4>{{ previewModel.name }}</h4>
              <div class="model-stats">
                <span v-if="previewModelInfo">
                  动作: {{ Object.keys(previewModelInfo.motions || {}).length }}
                </span>
                <span v-if="previewModelInfo">
                  表情: {{ (previewModelInfo.expressions || []).length }}
                </span>
              </div>

              <div class="preview-controls">
                <Button
                  size="small"
                  outlined
                  @click="playRandomMotion"
                  :disabled="!hasMotions">
                  随机动作
                </Button>
                <Button
                  size="small"
                  outlined
                  @click="playRandomExpression"
                  :disabled="!hasExpressions">
                  随机表情
                </Button>
              </div>

              <div class="scale-control">
                <label>模型缩放</label>
                <div class="scale-slider">
                  <Slider
                    v-model="modelScale"
                    :min="0.1"
                    :max="2"
                    :step="0.1" />
                  <span class="scale-value">{{ modelScale.toFixed(1) }}x</span>
                </div>
              </div>
            </div>
          </div>

          <div class="model-selector-section">
            <PetSelector
              ref="petSelectorRef"
              v-model="selectedModelIndex"
              @model-selected="onModelSelected"
              @models-loaded="onModelsLoaded" />
          </div>
        </div>
      </div>
    </div>

    <!-- 模型导入对话框 -->
    <ModelImportDialog
      v-model:visible="showImportDialog"
      @import-success="onImportSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import Slider from "primevue/slider";
import type { ModelConfig, ModelInfo } from "@/types/pet";
import PetDisplay from "@/components/Pet/PetDisplay.vue";
import PetSelector from "@/components/Pet/PetSelector.vue";
import ModelImportDialog from "@/components/Pet/ModelImportDialog.vue";
import { PetGlobalManager } from "@/components/Pet/PetGlobalManager";
import { Logger } from "@/utils/logger";

const previewDisplayRef = ref<InstanceType<typeof PetDisplay>>();
const petSelectorRef = ref<InstanceType<typeof PetSelector>>();

const selectedModelIndex = ref<number | null>(null);
const previewModelInfo = ref<ModelInfo | null>(null);
const previewModel = ref<ModelConfig | null>(null);
const modelScale = ref<number>(1.0);

// 导入对话框状态
const showImportDialog = ref(false);

// 使用全局宠物状态管理器
const { ref: preferences, cleanup: cleanupPrefsListener } =
  PetGlobalManager.createPreferencesRef();

const petEnabled = computed({
  get: () => preferences.value.isEnabledPet,
  set: async (enabled: boolean) => {
    await PetGlobalManager.updatePreferences({ isEnabledPet: enabled });
    if (enabled && petSelectorRef.value) {
      await nextTick();
      petSelectorRef.value.refreshModels?.();
    }
  },
});

const hasMotions = computed(() => {
  if (!previewModelInfo.value?.motions) return false;
  return Object.keys(previewModelInfo.value.motions).length > 0;
});

const hasExpressions = computed(() => {
  if (!previewModelInfo.value?.expressions) return false;
  return previewModelInfo.value.expressions.length > 0;
});

// 导入对话框事件处理
const onImportSuccess = async (modelName: string) => {
  Logger.info("PetSettings: 模型导入成功", modelName);

  // 刷新模型列表
  if (petSelectorRef.value) {
    await petSelectorRef.value.refreshModels();
  }

  // 可以在这里添加成功提示
  showImportDialog.value = false;
};

const onModelSelected = async (model: ModelConfig) => {
  previewModel.value = model;
  await PetGlobalManager.setSelectedModel(model);
  // 重置缩放
  modelScale.value = preferences.value.defaultScale || 1.0;
  if (previewDisplayRef.value) {
    previewDisplayRef.value.setModelScale(modelScale.value);
  }
};

const onModelsLoaded = async (models: ModelConfig[]) => {
  // 从 PetGlobalManager 异步获取当前选中的模型
  const current = await PetGlobalManager.getSelectedModel();
  if (!current) return;

  const index = models.findIndex(
    (m) => m.name === current.name && m.path === current.path,
  );
  selectedModelIndex.value = index !== -1 ? index : null;
  previewModel.value = current;
  modelScale.value = preferences.value.defaultScale || 1.0;
};

/** 预览模型加载完成 */
const onPreviewLoaded = (modelInfo: ModelInfo) => {
  previewModelInfo.value = modelInfo;
  // 加载完成后应用缩放
  modelScale.value = preferences.value.defaultScale || 1.0;
  if (previewDisplayRef.value) {
    previewDisplayRef.value.setModelScale(modelScale.value);
  }
};

/** 预览模型加载错误 */
const onPreviewError = (error: string) => {
  previewModelInfo.value = null;
  Logger.error("PetSettings: 预览模型加载失败", error);
};

/** 播放随机动作 */
const playRandomMotion = () => {
  if (!previewDisplayRef.value || !previewModelInfo.value?.motions) return;

  const groups = Object.keys(previewModelInfo.value.motions);
  if (!groups.length) return;

  const randomGroup = groups[Math.floor(Math.random() * groups.length)];
  const motions = previewModelInfo.value.motions[randomGroup];

  if (motions?.length) {
    previewDisplayRef.value.playMotion(
      randomGroup,
      Math.floor(Math.random() * motions.length),
    );
  }
};

/** 播放随机表情 */
const playRandomExpression = () => {
  const expressions = previewModelInfo.value?.expressions;
  if (!previewDisplayRef.value || !expressions?.length) return;

  previewDisplayRef.value.playExpression(
    Math.floor(Math.random() * expressions.length),
  );
};

/** 缩放变化处理 */
const onScaleChange = async (value: number) => {
  if (previewDisplayRef.value) {
    previewDisplayRef.value.setModelScale(value);
    // 保存到全局偏好设置
    await PetGlobalManager.updatePreferences({ defaultScale: value });
  }
};

// 监听缩放值变化
watch(modelScale, (newScale) => {
  onScaleChange(newScale);
});

onMounted(async () => {
  await PetGlobalManager.init();
  await nextTick();
});

onUnmounted(() => {
  // 清理事件监听器
  cleanupPrefsListener();
});
</script>

<style lang="less">
.pet-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;

  .settings-header {
    margin-bottom: 32px;
    text-align: center;

    h2 {
      margin: 0 0 8px 0;
      color: var(--theme-text);
      font-size: 24px;
      font-weight: 600;
    }
  }

  .settings-description {
    margin: 0;
    color: var(--theme-text-muted);
    font-size: 14px;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .setting-section {
      background: rgba(
        var(--theme-background-card-rgb),
        var(--theme-transparency-card)
      );
      border-radius: 8px;
      padding: 20px;
      border: 1px solid
        rgba(var(--theme-border-rgb), var(--theme-transparency-border));

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;

        h3 {
          margin: 0 0 4px 0;
          color: var(--theme-text);
          font-size: 16px;
          font-weight: 500;
        }

        p {
          margin: 0;
          color: var(--theme-text-muted);
          font-size: 13px;
        }

        .section-title {
          flex: 1;
        }

        .section-actions {
          flex-shrink: 0;
        }
      }

      .setting-item {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;

        .setting-label {
          flex: 1;

          h3 {
            margin: 0 0 4px 0;
            color: var(--theme-text);
            font-size: 16px;
            font-weight: 500;
          }

          label {
            display: block;
            margin: 0 0 4px 0;
            color: var(--theme-text);
            font-size: 14px;
            font-weight: 500;
          }

          p {
            margin: 0;
            color: var(--theme-text-muted);
            font-size: 13px;
            line-height: 1.4;
          }
        }

        .setting-control {
          flex-shrink: 0;
        }
      }

      .pet-selection-area {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;

        .pet-preview-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;

          .preview-container {
            background: rgba(
              var(--theme-background-secondary-rgb),
              var(--theme-transparency-background-secondary)
            );
            border: 2px solid
              rgba(var(--theme-border-rgb), var(--theme-transparency-border));
            border-radius: 12px;
            padding: 12px;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 104px;
            height: 104px;
          }

          .model-info {
            text-align: center;
            width: 100%;

            h4 {
              margin: 0 0 8px 0;
              color: var(--theme-text);
              font-size: 16px;
              font-weight: 500;
            }

            .model-stats {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-bottom: 12px;

              span {
                padding: 4px 8px;
                background: rgba(
                  var(--theme-background-secondary-rgb),
                  var(--theme-transparency-background-secondary)
                );
                border-radius: 12px;
                font-size: 12px;
                color: var(--theme-text-muted);
              }
            }

            .preview-controls {
              display: flex;
              gap: 8px;
              justify-content: center;
              margin-bottom: 12px;
            }

            .scale-control {
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid
                rgba(var(--theme-border-rgb), var(--theme-transparency-border));

              label {
                display: block;
                margin-bottom: 8px;
                font-size: 13px;
                color: var(--theme-text-muted);
                text-align: center;
              }

              .scale-slider {
                .scale-value {
                  font-size: 13px;
                  color: var(--theme-text);
                  font-weight: 500;
                  min-width: 35px;
                }
              }
            }
          }
        }

        .model-selector-section {
          max-height: 400px;
          overflow-y: auto;
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding: 16px;

    .settings-content {
      .setting-section {
        .pet-selection-area {
          grid-template-columns: 1fr;
          gap: 16px;
        }
      }
    }
  }
}
</style>
