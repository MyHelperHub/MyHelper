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
            <ToggleSwitch 
              v-model="petEnabled" 
              @update:modelValue="onPetEnabledChange" />
          </div>
        </div>
      </div>

      <!-- 宠物选择区域 -->
      <div class="setting-section">
        <div class="section-header">
          <h3>选择宠物</h3>
          <p>从可用模型中选择您喜欢的宠物</p>
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

      <!-- 宠物行为设置 -->
      <div v-if="petEnabled && selectedModel" class="setting-section">
        <div class="section-header">
          <h3>显示设置</h3>
          <p>调整宠物的显示方式和行为</p>
        </div>

        <div class="setting-grid">
          <div class="setting-item">
            <div class="setting-label">
              <label>显示大小</label>
              <p>调整宠物在桌面上的显示尺寸</p>
            </div>
            <div class="setting-control">
              <div class="scale-control">
                <Slider 
                  v-model="modelScale" 
                  :min="0.5" 
                  :max="2.0" 
                  :step="0.1"
                  @change="onScaleChange" />
                <span class="scale-value">{{ Math.round(modelScale * 100) }}%</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="petEnabled" class="setting-section">
        <div class="action-buttons">
          <Button @click="refreshModels" outlined>
            <i class="pi pi-refresh"></i>
            刷新模型列表
          </Button>
          <Button @click="resetSettings" severity="secondary" outlined>
            <i class="pi pi-undo"></i>
            重置设置
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import Slider from "primevue/slider";
import type { ModelConfig, ModelInfo } from "@/interface/pet";
import { PetDisplay, PetSelector } from "@/components/Pet";
import { petManager } from "@/components/Pet/petManager";
import { Logger } from "@/utils/logger";

const previewDisplayRef = ref<InstanceType<typeof PetDisplay>>();
const petSelectorRef = ref<InstanceType<typeof PetSelector>>();

const selectedModelIndex = ref<number | null>(null);
const previewModelInfo = ref<ModelInfo | null>(null);
const previewModel = ref<ModelConfig | null>(null); // 本地预览模型状态

const selectedModel = petManager.getSelectedModelRef(); // 数据库中的选中模型
const preferences = petManager.getPreferencesRef();

/** 宠物是否启用 */
const petEnabled = computed({
  get: () => preferences.value.isEnabledPet,
  set: (enabled: boolean) => petManager.setPreferences({ isEnabledPet: enabled })
});

/** 模型缩放比例 */
const modelScale = computed({
  get: () => preferences.value.defaultScale || 1.0,
  set: (scale: number) => petManager.setPreferences({ defaultScale: scale })
});


const hasMotions = computed(() => {
  if (!previewModelInfo.value?.motions) return false;
  return Object.keys(previewModelInfo.value.motions).length > 0;
});

const hasExpressions = computed(() => {
  if (!previewModelInfo.value?.expressions) return false;
  return previewModelInfo.value.expressions.length > 0;
});

/** 宠物启用状态变化 */
const onPetEnabledChange = (enabled: boolean) => {
  Logger.info("PetSettings: 宠物启用状态变更", enabled.toString());
};

/** 模型选择事件 */
const onModelSelected = async (model: ModelConfig) => {
  previewModel.value = model;
  await petManager.setSelectedModel(model);
  Logger.info("PetSettings: 选择新宠物模型", model.name);
};

/** 模型列表加载完成 */
const onModelsLoaded = (models: ModelConfig[]) => {
  const current = selectedModel.value;
  if (current) {
    const index = models.findIndex(
      (m) => m.name === current.name && m.path === current.path,
    );
    selectedModelIndex.value = index !== -1 ? index : null;
    previewModel.value = current;
  }
};

/** 预览模型加载完成 */
const onPreviewLoaded = (modelInfo: ModelInfo) => {
  previewModelInfo.value = modelInfo;
  
  nextTick(() => {
    if (previewDisplayRef.value) {
      previewDisplayRef.value.setModelScale(modelScale.value);
    }
  });
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

/** 缩放变化 */
const onScaleChange = () => {
  if (previewDisplayRef.value) {
    previewDisplayRef.value.setModelScale(modelScale.value);
  }
};

/** 刷新模型列表 */
const refreshModels = () => {
  petSelectorRef.value?.refreshModels();
};

/** 重置所有设置 */
const resetSettings = async () => {
  await petManager.setPreferences({
    isEnabledPet: false,
    defaultScale: 1.0,
  });
  
  if (previewDisplayRef.value) {
    previewDisplayRef.value.setModelScale(1.0);
  }
};

onMounted(async () => {
  await petManager.init();
  
  if (selectedModel.value) {
    previewModel.value = selectedModel.value;
    
    await nextTick();
    if (previewDisplayRef.value) {
      await previewDisplayRef.value.loadModel();
    }
  }
});
</script>

<style scoped>
.pet-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-header {
  margin-bottom: 32px;
  text-align: center;
}

.settings-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 24px;
  font-weight: 600;
}

.settings-description {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 14px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-section {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--surface-border);
}

.section-header {
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0 0 4px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 500;
}

.section-header p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.setting-label {
  flex: 1;
}

.setting-label h3 {
  margin: 0 0 4px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 500;
}

.setting-label label {
  display: block;
  margin: 0 0 4px 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
}

.setting-label p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.setting-control {
  flex-shrink: 0;
}

.setting-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pet-selection-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.pet-preview-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-container {
  background: var(--surface-ground);
  border: 2px solid var(--surface-border);
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
}

.model-info h4 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 500;
}

.model-stats {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 12px;
}

.model-stats span {
  padding: 4px 8px;
  background: var(--surface-100);
  border-radius: 12px;
  font-size: 12px;
  color: var(--text-color-secondary);
}

.preview-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.model-selector-section {
  max-height: 400px;
  overflow-y: auto;
}

.scale-control {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.scale-value {
  font-size: 13px;
  color: var(--text-color-secondary);
  min-width: 40px;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .pet-settings {
    padding: 16px;
  }
  
  .pet-selection-area {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .scale-control {
    min-width: auto;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>