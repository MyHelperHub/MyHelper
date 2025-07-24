<template>
  <div class="pet-window">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ error }}</div>
      <button @click="retry" class="retry-button">重试</button>
    </div>

    <!-- 宠物渲染容器 -->
    <div
      v-else
      ref="petContainer"
      class="pet-container"
      :class="{ 'can-drag': !isInteracting }"
      @mousedown="handleMouseDown"
      @contextmenu="handleContextMenu"
    >
      <!-- 空状态 -->
      <div v-if="!currentModel" class="empty-state">
        <div class="empty-icon">🐾</div>
        <div class="empty-text">请选择一个宠物模型</div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      ref="contextMenu"
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="menu-item" @click="switchToInlineMode">
        <span class="menu-icon">📱</span>
        <span>切换到内嵌模式</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="openModelSelector">
        <span class="menu-icon">🎭</span>
        <span>选择模型</span>
      </div>
      <div class="menu-item" @click="toggleInteraction">
        <span class="menu-icon">{{ isInteracting ? '🔒' : '👆' }}</span>
        <span>{{ isInteracting ? '禁用交互' : '启用交互' }}</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="closeWindow">
        <span class="menu-icon">❌</span>
        <span>关闭宠物</span>
      </div>
    </div>

    <!-- 模型选择器 -->
    <div v-if="showModelSelector" class="model-selector-overlay" @click="closeModelSelector">
      <div class="model-selector" @click.stop>
        <div class="selector-header">
          <h3>选择宠物模型</h3>
          <button @click="closeModelSelector" class="close-button">×</button>
        </div>
        <div class="model-list">
          <div
            v-for="model in availableModels"
            :key="model.id"
            class="model-item"
            :class="{ active: model.id === currentModel?.id }"
            @click="selectModel(model)"
          >
            <div class="model-preview">
              <img v-if="model.preview" :src="model.preview" :alt="model.name" />
              <div v-else class="no-preview">{{ model.technology.toUpperCase() }}</div>
            </div>
            <div class="model-info">
              <div class="model-name">{{ model.name }}</div>
              <div class="model-tech">{{ model.technology }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { usePetSingleton } from '../composables/usePet';
import type { AnimationModel } from '../types';
import { ipcWindowControl } from '../../api/ipc/window.api';
import { WindowOperation } from '../../interface/enum';
import { NewWindowEnum } from '../../interface/windowEnum';

// 使用宠物状态管理
const petStore = usePetSingleton();

// 组件状态
const petContainer = ref<HTMLElement>();
const contextMenu = ref<HTMLElement>();
const isLoading = ref(true);
const error = ref<string | null>(null);
const showContextMenu = ref(false);
const showModelSelector = ref(false);
const contextMenuStyle = ref<Record<string, string>>({});
const isInteracting = ref(true);
const isDragging = ref(false);

// 动画管理器
let animationManager: any = null;

// 计算属性
const currentModel = computed(() => petStore.currentModel.value);
const availableModels = computed(() => petStore.availableModels.value);

// 初始化
onMounted(async () => {
  try {
    await initializePet();
  } catch (err) {
    handleError(err);
  }
});

// 清理
onUnmounted(() => {
  cleanup();
});

// 初始化宠物
const initializePet = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    // 初始化宠物状态
    await petStore.initPetState();

    // 等待DOM渲染
    await nextTick();

    // 创建动画管理器
    if (petContainer.value) {
      animationManager = petStore.createManager();
      await animationManager.initialize(petContainer.value, {
        width: 300,
        height: 400,
        interactive: isInteracting.value,
      });

      // 如果有当前模型，加载它
      if (currentModel.value) {
        await loadCurrentModel();
      }

      // 设置点击回调
      animationManager.onModelClick(() => {
        console.log('宠物被点击了！');
      });
    }

    isLoading.value = false;
  } catch (err) {
    handleError(err);
  }
};

// 加载当前模型
const loadCurrentModel = async () => {
  if (!animationManager || !currentModel.value) return;

  try {
    await animationManager.loadModel(currentModel.value);
    console.log('模型加载成功:', currentModel.value.name);
  } catch (err) {
    console.error('模型加载失败:', err);
    throw err;
  }
};

// 错误处理
const handleError = (err: any) => {
  const errorMessage = err instanceof Error ? err.message : '未知错误';
  error.value = errorMessage;
  isLoading.value = false;
  console.error('宠物窗口错误:', err);
};

// 重试
const retry = async () => {
  await initializePet();
};

// 选择模型
const selectModel = async (model: AnimationModel) => {
  try {
    await petStore.setCurrentModel(model);
    await loadCurrentModel();
    closeModelSelector();
  } catch (err) {
    handleError(err);
  }
};

// 鼠标按下处理（拖拽）
const handleMouseDown = (event: MouseEvent) => {
  if (isInteracting.value || event.button !== 0) return;

  isDragging.value = true;
  
  // 这里可以添加拖拽逻辑
  // 由于这是独立窗口，拖拽由Tauri处理
};

// 右键菜单
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  
  contextMenuStyle.value = {
    left: `${event.clientX}px`,
    top: `${event.clientY}px`,
  };
  
  showContextMenu.value = true;

  // 点击其他地方关闭菜单
  const closeMenu = () => {
    showContextMenu.value = false;
    document.removeEventListener('click', closeMenu);
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
};

// 切换到内嵌模式
const switchToInlineMode = async () => {
  await petStore.setDisplayMode('inline');
  closeWindow();
  showContextMenu.value = false;
};

// 打开模型选择器
const openModelSelector = () => {
  showModelSelector.value = true;
  showContextMenu.value = false;
};

// 关闭模型选择器
const closeModelSelector = () => {
  showModelSelector.value = false;
};

// 切换交互模式
const toggleInteraction = () => {
  isInteracting.value = !isInteracting.value;
  if (animationManager) {
    animationManager.setInteractive(isInteracting.value);
  }
  showContextMenu.value = false;
};

// 关闭窗口
const closeWindow = async () => {
  await petStore.setPetEnabled(false);
  await ipcWindowControl(WindowOperation.Close, { window_id: NewWindowEnum.Pet });
  showContextMenu.value = false;
};

// 清理资源
const cleanup = () => {
  if (animationManager) {
    petStore.destroyManager();
    animationManager = null;
  }
  showContextMenu.value = false;
  showModelSelector.value = false;
};
</script>

<style scoped>
.pet-window {
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent;
  overflow: hidden;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text,
.error-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.retry-button {
  margin-top: 12px;
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.retry-button:hover {
  background: #2980b9;
}

.pet-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.pet-container.can-drag {
  cursor: move;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 160px;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-icon {
  margin-right: 8px;
  width: 16px;
  text-align: center;
}

.menu-divider {
  height: 1px;
  background: #eee;
  margin: 4px 8px;
}

.model-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.model-selector {
  background: white;
  border-radius: 12px;
  width: 400px;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #666;
}

.model-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.model-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
}

.model-item:hover {
  background: #f5f5f5;
}

.model-item.active {
  background: #e3f2fd;
  border: 1px solid #2196f3;
}

.model-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
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
  flex: 1;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.model-tech {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}
</style>