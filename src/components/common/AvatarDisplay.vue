<template>
  <div 
    class="avatar-display" 
    :class="{ 
      'small-mode': isSmallMode, 
      'large-mode': !isSmallMode,
      'has-pet': !!selectedModel 
    }"
    @click="handleClick">
    
    <!-- 宠物显示区域 - 始终存在 -->
    <div v-if="selectedModel" class="pet-container">
      <PetDisplay
        ref="petDisplayRef"
        :model-config="selectedModel"
        :width="displaySize.width"
        :height="displaySize.height"
        @loaded="onModelLoaded"
        @error="onModelError" />
      
      <!-- 小窗模式下的交互提示 -->
      <div v-if="isSmallMode" class="interaction-hint">
        <div class="click-ripple" :class="{ active: showRipple }"></div>
      </div>
    </div>

    <!-- 无宠物时显示默认logo -->
    <div v-else class="default-logo">
      <img
        :src="defaultLogo"
        :class="logoClass" />
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay" @click.stop="retryLoad">
      <i class="pi pi-refresh"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import type { ModelInfo } from "@/interface/pet";
import { PetDisplay } from "@/components/Pet";
import { petManager } from "@/utils/petManager";
import { isMainMenuVisible } from "@/utils/windowManager";
import { Logger } from "@/utils/logger";

interface Props {
  defaultLogo?: string;
  logoClass?: string;
}

withDefaults(defineProps<Props>(), {
  defaultLogo: "/logo.png",
  logoClass: "",
});

const emit = defineEmits<{
  click: [];
  loaded: [modelInfo: ModelInfo];
  error: [error: string];
}>();

// 组件引用
const petDisplayRef = ref<InstanceType<typeof PetDisplay>>();

// 状态
const isLoading = ref(false);
const error = ref<string | null>(null);
const showRipple = ref(false);

// 获取选中的宠物模型（响应式）
const selectedModel = petManager.getSelectedModelRef();

// 监听窗口状态变化
const isSmallMode = computed(() => !isMainMenuVisible.value);

// 固定显示尺寸 - 保持模型大小不变，确保完整显示
const displaySize = computed(() => {
  // 使用固定的60px尺寸，确保模型在小窗模式下完整显示
  return { width: 60, height: 60 };
});

// 加载宠物模型
const loadPetModel = async () => {
  if (!selectedModel.value || !petDisplayRef.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    Logger.info("AvatarDisplay: 开始加载宠物模型", selectedModel.value.name);
    await petDisplayRef.value.loadModel();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "加载宠物模型失败";
    error.value = errorMsg;
    emit("error", errorMsg);
    Logger.error("AvatarDisplay: 加载失败", errorMsg);
  } finally {
    isLoading.value = false;
  }
};

// 重试加载
const retryLoad = () => {
  error.value = null;
  loadPetModel();
};

// 处理点击事件
const handleClick = () => {
  // 发出点击事件，让父组件处理窗口切换
  emit("click");
  
  if (isSmallMode.value && selectedModel.value) {
    // 小窗模式下点击宠物显示涟漪效果
    showRipple.value = true;
    setTimeout(() => {
      showRipple.value = false;
    }, 600);
    
    // 播放随机动作
    if (petDisplayRef.value) {
      playRandomInteraction();
    }
  }
};

// 播放随机交互
const playRandomInteraction = () => {
  if (!petDisplayRef.value) return;
  
  // 随机选择播放动作或表情
  const actions = ["motion", "expression"];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  
  if (randomAction === "motion") {
    petDisplayRef.value.playMotion("idle", 0);
  } else {
    petDisplayRef.value.playExpression(0);
  }
};

// 模型加载完成
const onModelLoaded = (modelInfo: ModelInfo) => {
  Logger.info("AvatarDisplay: 模型加载完成", selectedModel.value?.name);
  
  // 缓存模型信息
  if (selectedModel.value) {
    petManager.cacheModelInfo(selectedModel.value, modelInfo);
  }
  
  emit("loaded", modelInfo);
};

// 模型加载错误
const onModelError = (errorMsg: string) => {
  error.value = errorMsg;
  emit("error", errorMsg);
};

// 监听选中模型变化
watch(selectedModel, async (newModel) => {
  if (newModel) {
    await nextTick();
    await loadPetModel();
  } else {
    error.value = null;
  }
}, { immediate: false });

// 组件挂载
onMounted(async () => {
  // 初始化宠物管理器
  await petManager.init();
  
  // 如果有选中的模型，加载它
  if (selectedModel.value) {
    await nextTick();
    await loadPetModel();
  }
});

// 暴露方法给父组件
defineExpose({
  loadPetModel,
  retryLoad,
  playRandomInteraction,
  getSelectedModel: () => selectedModel.value,
});
</script>

<style scoped>
.avatar-display {
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
  border-radius: 50%;
}

/* 小窗模式 - 显示完整区域 */
.small-mode {
  width: 60px;
  height: 60px;
}

/* 大窗模式 - 裁剪到中心区域 */
.large-mode {
  width: 32px;
  height: 32px;
}

/* 宠物容器始终保持固定尺寸和绝对定位 */
.pet-container,
.default-logo {
  position: absolute;
  width: 60px;
  height: 60px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.default-logo img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: transform 0.2s ease;
  user-select: none;
  -webkit-user-drag: none;
  object-fit: cover;
}

.avatar-display:hover .default-logo img {
  transform: scale(1.05);
}

.avatar-display:active .default-logo img {
  transform: scale(0.95);
}

/* 小窗模式特殊样式 */
.small-mode .interaction-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  pointer-events: none;
}

.click-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(var(--theme-primary-rgb), 0.3);
  transform: translate(-50%, -50%);
  transition: all 0.6s ease-out;
}

.click-ripple.active {
  width: 120%;
  height: 120%;
  opacity: 0;
}

/* 大窗模式的特殊样式 */
.large-mode {
  box-shadow: 0 2px 8px rgba(var(--theme-primary-rgb), 0.2);
  border: 1px solid rgba(var(--theme-primary-rgb), 0.15);
}

.large-mode:hover {
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
  border-color: rgba(var(--theme-primary-rgb), 0.3);
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top: 2px solid var(--theme-primary, #007bff);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: rgba(255, 107, 107, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
}

.error-overlay:hover {
  background: rgba(255, 107, 107, 1);
  transform: translate(-50%, -50%) scale(1.1);
}

.error-overlay i {
  color: white;
  font-size: 10px;
}
</style>