<template>
  <div class="pet-settings">
    <!-- 桌面宠物设置标题 -->
    <div class="setting-section">
      <h3>桌面宠物设置</h3>
      
      <!-- 宠物开关 -->
      <div class="item">
        <div class="item-content">
          <h4>启用桌面宠物</h4>
          <p class="item-desc">在桌面显示Live2D动画宠物</p>
        </div>
        <ToggleSwitch 
          v-model="petEnabled" 
          @update:modelValue="handlePetEnabledChange"
        >
          <template #handle="{ checked }">
            <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]"></i>
          </template>
        </ToggleSwitch>
      </div>

      <!-- 显示模式选择 -->
      <div v-if="petEnabled" class="item">
        <div class="item-content">
          <h4>显示模式</h4>
          <p class="item-desc">选择宠物的显示方式</p>
        </div>
        <div class="mode-selector">
          <Button 
            label="内嵌模式"
            :severity="displayMode === 'inline' ? 'info' : 'secondary'"
            size="small"
            @click="handleDisplayModeChange('inline')"
          />
          <Button 
            label="窗口模式"
            :severity="displayMode === 'window' ? 'info' : 'secondary'"
            size="small"
            @click="handleDisplayModeChange('window')"
          />
        </div>
      </div>

      <!-- 模型选择 -->
      <div v-if="petEnabled" class="item model-selection">
        <div class="item-content">
          <h4>选择模型</h4>
          <p class="item-desc">选择要显示的宠物模型</p>
        </div>
        
        <div class="model-grid">
          <!-- 加载状态 -->
          <div v-if="isLoadingModels" class="loading-models">
            <div class="loading-spinner"></div>
            <span>加载模型中...</span>
          </div>
          
          <!-- 模型列表 -->
          <div v-else-if="availableModels.length > 0" class="model-list">
            <div
              v-for="model in availableModels"
              :key="model.id"
              class="model-card"
              :class="{ active: currentModelId === model.id }"
              @click="selectModel(model)"
            >
              <div class="model-preview">
                <img v-if="model.preview" :src="model.preview" :alt="model.name" />
                <div v-else class="no-preview">
                  {{ model.technology.toUpperCase() }}
                </div>
              </div>
              <div class="model-info">
                <div class="model-name">{{ model.name }}</div>
                <div class="model-tech">{{ model.technology }}</div>
              </div>
            </div>
          </div>
          
          <!-- 无模型状态 -->
          <div v-else class="no-models">
            <i class="pi pi-exclamation-triangle"></i>
            <span>未找到可用的宠物模型</span>
          </div>
        </div>
      </div>

      <!-- 窗口设置 -->
      <div v-if="petEnabled && displayMode === 'window'" class="item">
        <div class="item-content">
          <h4>窗口设置</h4>
          <p class="item-desc">配置宠物窗口属性</p>
        </div>
        
        <div class="window-settings">
          <div class="setting-row">
            <label>窗口大小:</label>
            <div class="size-inputs">
              <InputNumber 
                v-model="windowConfig.width" 
                :min="200" 
                :max="800"
                suffix="px"
                size="small"
                @input="handleWindowConfigChange"
              />
              <span>×</span>
              <InputNumber 
                v-model="windowConfig.height" 
                :min="200" 
                :max="800"
                suffix="px"
                size="small"
                @input="handleWindowConfigChange"
              />
            </div>
          </div>
          
          <div class="setting-row">
            <label>置顶显示:</label>
            <ToggleSwitch 
              v-model="windowConfig.alwaysOnTop"
              @change="handleWindowConfigChange"
            />
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="petEnabled" class="item stats-section">
        <div class="item-content">
          <h4>统计信息</h4>
          <p class="item-desc">宠物系统状态信息</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ petStats.totalModels }}</div>
            <div class="stat-label">总模型数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ petStats.live2dModels }}</div>
            <div class="stat-label">Live2D模型</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ petStats.isActive ? '运行中' : '已停止' }}</div>
            <div class="stat-label">状态</div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="petEnabled" class="item actions-section">
        <div class="actions-grid">
          <Button 
            label="刷新模型"
            icon="pi pi-refresh"
            severity="secondary"
            size="small"
            @click="refreshModels"
            :loading="isRefreshing"
          />
          
          <Button 
            label="重置设置"
            icon="pi pi-undo"
            severity="danger"
            size="small"
            @click="resetPetSettings"
          />
          
          <Button 
            v-if="displayMode === 'window'"
            label="打开宠物窗口"
            icon="pi pi-external-link"
            severity="info"
            size="small"
            @click="openPetWindow"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import { usePetSingleton } from '@/desktop-pet/composables/usePet';
import type { AnimationModel } from '@/desktop-pet/types';
import { ipcCreateNewWindow } from '@/api/ipc/window.api';
import { NewWindowEnum, WINDOW_CONFIG } from '@/interface/windowEnum';

// 使用宠物状态管理
const petStore = usePetSingleton();

// 组件状态
const isLoadingModels = ref(false);
const isRefreshing = ref(false);

// 设置数据
const petEnabled = ref(false);
const displayMode = ref<'inline' | 'window'>('inline');
const currentModelId = ref<string>('');
const windowConfig = ref({
  width: 300,
  height: 400,
  alwaysOnTop: true,
});

// 计算属性
const availableModels = computed(() => petStore.availableModels.value);
const petStats = computed(() => petStore.getPetStats.value);

// 初始化
onMounted(async () => {
  await loadSettings();
  await loadModels();
});

// 监听宠物状态变化
watch(() => petStore.petState.value, (newState) => {
  petEnabled.value = newState.enabled;
  displayMode.value = newState.displayMode;
  currentModelId.value = newState.currentModel?.id || '';
  if (newState.windowConfig) {
    windowConfig.value = { ...newState.windowConfig };
  }
}, { deep: true });

// 加载设置
const loadSettings = async () => {
  try {
    await petStore.initPetState();
    
    const state = petStore.petState.value;
    petEnabled.value = state.enabled;
    displayMode.value = state.displayMode;
    currentModelId.value = state.currentModel?.id || '';
    
    if (state.windowConfig) {
      windowConfig.value = { ...state.windowConfig };
    }
  } catch (error) {
    console.error('加载宠物设置失败:', error);
  }
};

// 加载模型
const loadModels = async () => {
  try {
    isLoadingModels.value = true;
    await petStore.refreshModels();
  } catch (error) {
    console.error('加载模型失败:', error);
  } finally {
    isLoadingModels.value = false;
  }
};

// 处理宠物启用状态变化
const handlePetEnabledChange = async (enabled: boolean) => {
  try {
    await petStore.setPetEnabled(enabled);
    
    // 如果启用宠物但没有选择模型，自动选择第一个可用模型
    if (enabled && availableModels.value.length > 0 && !currentModelId.value) {
      await selectModel(availableModels.value[0]);
    }
  } catch (error) {
    console.error('设置宠物启用状态失败:', error);
    // 回滚状态
    petEnabled.value = !enabled;
  }
};

// 处理显示模式变化
const handleDisplayModeChange = async (mode: 'inline' | 'window') => {
  try {
    await petStore.setDisplayMode(mode);
    displayMode.value = mode;
  } catch (error) {
    console.error('设置显示模式失败:', error);
  }
};

// 选择模型
const selectModel = async (model: AnimationModel) => {
  try {
    await petStore.setCurrentModel(model);
    currentModelId.value = model.id;
  } catch (error) {
    console.error('选择模型失败:', error);
  }
};

// 处理窗口配置变化
const handleWindowConfigChange = async () => {
  try {
    await petStore.updateWindowConfig(windowConfig.value);
  } catch (error) {
    console.error('更新窗口配置失败:', error);
  }
};

// 刷新模型
const refreshModels = async () => {
  try {
    isRefreshing.value = true;
    await petStore.refreshModels();
  } catch (error) {
    console.error('刷新模型失败:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// 重置宠物设置
const resetPetSettings = async () => {
  try {
    await petStore.resetPetState();
    await loadSettings();
  } catch (error) {
    console.error('重置宠物设置失败:', error);
  }
};

// 打开宠物窗口
const openPetWindow = async () => {
  try {
    await ipcCreateNewWindow(WINDOW_CONFIG[NewWindowEnum.Pet]);
  } catch (error) {
    console.error('打开宠物窗口失败:', error);
  }
};
</script>

<style scoped>
.pet-settings {
  padding: 20px;
}

.setting-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 8px;
}

.item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.item:last-child {
  border-bottom: none;
}

.item-content {
  flex: 1;
  margin-right: 16px;
}

.item-content h4 {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
}

.item-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.mode-selector {
  display: flex;
  gap: 8px;
}

.model-selection {
  flex-direction: column;
  align-items: stretch;
}

.model-grid {
  margin-top: 12px;
}

.loading-models {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
  font-size: 14px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.model-card {
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.model-card:hover {
  border-color: #ddd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.model-card.active {
  border-color: #2196f3;
  background: #f3f9ff;
}

.model-preview {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}

.model-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-preview {
  font-size: 10px;
  color: #999;
  text-align: center;
  font-weight: bold;
}

.model-info {
  text-align: center;
}

.model-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.model-tech {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}

.no-models {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.no-models i {
  margin-right: 8px;
  font-size: 16px;
}

.window-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-row label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-inputs span {
  color: #999;
  font-size: 14px;
}

.stats-section {
  flex-direction: column;
  align-items: stretch;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}

.actions-section {
  flex-direction: column;
  align-items: stretch;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 12px;
}
</style>