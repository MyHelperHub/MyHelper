<template>
  <div class="pet-inline" :class="{ disabled: !isEnabled }">
    <!-- 宠物渲染容器 -->
    <div
      v-if="true"
      ref="petContainer"
      class="pet-container"
      @click="handlePetClick"
      @contextmenu="handleContextMenu"
    ></div>

    <!-- 默认Logo（当宠物未启用时显示） -->
    <div
      v-else
      class="default-logo"
      @click="handleLogoClick"
      @contextmenu="handleContextMenu"
    >
      <img class="logo" :src="logoSrc" alt="MyHelper" />
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="showContextMenu"
      ref="contextMenu"
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div v-if="!isEnabled" class="menu-item" @click="enablePet">
        <span class="menu-icon">🐾</span>
        <span>启用桌面宠物</span>
      </div>
      <div v-else class="menu-item" @click="disablePet">
        <span class="menu-icon">😴</span>
        <span>禁用桌面宠物</span>
      </div>
      
      <div v-if="isEnabled" class="menu-divider"></div>
      
      <div v-if="isEnabled" class="menu-item" @click="switchToWindowMode">
        <span class="menu-icon">🪟</span>
        <span>切换到窗口模式</span>
      </div>
      
      <div v-if="isEnabled" class="menu-item" @click="openModelSelector">
        <span class="menu-icon">🎭</span>
        <span>选择模型</span>
      </div>
    </div>

    <!-- 简化的模型选择器 -->
    <div v-if="showModelSelector" class="model-selector-overlay" @click="closeModelSelector">
      <div class="mini-model-selector" @click.stop>
        <div class="selector-title">选择宠物</div>
        <div class="mini-model-list">
          <div
            v-for="model in availableModels"
            :key="model.id"
            class="mini-model-item"
            :class="{ active: model.id === currentModel?.id }"
            @click="selectModel(model)"
          >
            <div class="mini-model-name">{{ model.name }}</div>
            <div class="mini-model-tech">{{ model.technology }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="mini-loading">⏳</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { usePetSingleton } from '../composables/usePet';
import type { AnimationModel } from '../types';
import { ipcCreateNewWindow } from '../../api/ipc/window.api';
import { NewWindowEnum, WINDOW_CONFIG } from '../../interface/windowEnum';

// Props
interface Props {
  logoSrc: string;
  onLogoClick?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  logoSrc: '/src/assets/images/logo.png',
});

// 使用宠物状态管理
const petStore = usePetSingleton();

// 组件状态
const petContainer = ref<HTMLElement>();
const contextMenu = ref<HTMLElement>();
const showContextMenu = ref(false);
const showModelSelector = ref(false);
const contextMenuStyle = ref<Record<string, string>>({});
const isLoading = ref(false);

// 动画管理器
let animationManager: any = null;

// 计算属性
const isEnabled = computed(() => petStore.isEnabled.value);
const currentModel = computed(() => petStore.currentModel.value);
const availableModels = computed(() => petStore.availableModels.value);

// 监听宠物启用状态变化
watch(
  () => isEnabled.value,
  async (newEnabled) => {
    if (newEnabled && currentModel.value) {
      await nextTick();
      await initializePetRenderer();
    } else {
      cleanup();
    }
  }
);

// 监听模型变化
watch(
  () => currentModel.value,
  async (newModel) => {
    if (isEnabled.value && newModel) {
      await loadModel(newModel);
    }
  }
);

// 初始化
onMounted(async () => {
  try {
    await petStore.initPetState();
    
    if (isEnabled.value && currentModel.value) {
      await nextTick();
      await initializePetRenderer();
    }
  } catch (err) {
    console.error('内嵌宠物初始化失败:', err);
  }
});

// 清理
onUnmounted(() => {
  cleanup();
});

// 初始化宠物渲染器
const initializePetRenderer = async () => {
  if (!petContainer.value || !currentModel.value) return;

  try {
    isLoading.value = true;

    // 创建动画管理器
    animationManager = petStore.createManager();
    
    // 小窗尺寸配置 (适应65x65的小窗)
    await animationManager.initialize(petContainer.value, {
      width: 55,
      height: 55,
      scale: 0.8, // 适当缩放以适应小窗
      interactive: true,
    });

    // 加载当前模型
    await animationManager.loadModel(currentModel.value);

    // 设置点击回调
    animationManager.onModelClick(() => {
      console.log('内嵌宠物被点击！');
      // 可以播放特殊动画或者执行其他交互
    });

    isLoading.value = false;
  } catch (err) {
    console.error('宠物渲染器初始化失败:', err);
    isLoading.value = false;
  }
};

// 加载模型
const loadModel = async (model: AnimationModel) => {
  if (!animationManager) return;

  try {
    isLoading.value = true;
    await animationManager.loadModel(model);
    isLoading.value = false;
  } catch (err) {
    console.error('内嵌模型加载失败:', err);
    isLoading.value = false;
  }
};

// 处理宠物点击
const handlePetClick = () => {
  // 可以添加特殊的点击效果
  console.log('内嵌宠物被点击');
};

// 处理Logo点击
const handleLogoClick = () => {
  if (props.onLogoClick) {
    props.onLogoClick();
  }
};

// 右键菜单
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
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

// 启用宠物
const enablePet = async () => {
  await petStore.setPetEnabled(true);
  
  // 如果没有当前模型，选择第一个可用模型
  if (!currentModel.value && availableModels.value.length > 0) {
    await petStore.setCurrentModel(availableModels.value[0]);
  }
  
  showContextMenu.value = false;
};

// 禁用宠物
const disablePet = async () => {
  await petStore.setPetEnabled(false);
  showContextMenu.value = false;
};

// 切换到窗口模式
const switchToWindowMode = async () => {
  await petStore.setDisplayMode('window');
  // 打开宠物窗口
  await ipcCreateNewWindow(WINDOW_CONFIG[NewWindowEnum.Pet]);
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

// 选择模型
const selectModel = async (model: AnimationModel) => {
  await petStore.setCurrentModel(model);
  closeModelSelector();
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
.pet-inline {
  width: 55px;
  height: 55px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.pet-inline:hover {
  transform: scale(1.05);
}

.pet-inline.disabled {
  opacity: 0.8;
}

.pet-container {
  width: 100%;
  height: 100%;
  cursor: pointer;
  position: relative;
}

.default-logo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.default-logo:hover .logo {
  transform: scale(1.1);
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 2px 0;
  min-width: 140px;
  z-index: 1000;
  font-size: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
  color: #333;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-icon {
  margin-right: 6px;
  width: 14px;
  text-align: center;
  font-size: 11px;
}

.menu-divider {
  height: 1px;
  background: #eee;
  margin: 2px 6px;
}

.model-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.mini-model-selector {
  background: white;
  border-radius: 8px;
  width: 250px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.selector-title {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #eee;
  text-align: center;
}

.mini-model-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.mini-model-item {
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2px;
  transition: background 0.2s ease;
}

.mini-model-item:hover {
  background: #f5f5f5;
}

.mini-model-item.active {
  background: #e3f2fd;
  border: 1px solid #2196f3;
}

.mini-model-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.mini-model-tech {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.mini-loading {
  font-size: 16px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>