<template>
  <div class="pet-main-display" :class="{ 'small-mode': isSmallMode }">
    <!-- 宠物显示区域 -->
    <div v-if="selectedModel" class="pet-container" @click="handleClick">
      <PetDisplay
        ref="petDisplayRef"
        :key="`${selectedModel.name}-${isSmallMode ? 'small' : 'large'}`"
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
    <div v-else class="default-logo" @click="handleClick">
      <img :src="defaultLogo" :class="logoClass" />
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay" @click="retryLoad">
      <i class="pi pi-refresh"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import type { ModelInfo } from "@/interface/pet";
import PetDisplay from "./PetDisplay.vue";
import { petManager } from "@/components/Pet/petManager";
import { Logger } from "@/utils/logger";

interface Props {
  isSmallMode?: boolean;
  defaultLogo?: string;
  logoClass?: string;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isSmallMode: false,
  defaultLogo: "/logo.png",
  logoClass: "",
  width: 60,
  height: 60,
});

const emit = defineEmits<{
  click: [];
  loaded: [modelInfo: ModelInfo];
  error: [error: string];
}>();

const petDisplayRef = ref<InstanceType<typeof PetDisplay>>();

const isLoading = ref(false);
const error = ref<string | null>(null);
const showRipple = ref(false);

/** 获取选中的宠物模型（响应式） */
const selectedModel = petManager.getSelectedModelRef();

/** 计算显示尺寸 */
const displaySize = computed(() => {
  if (props.isSmallMode) {
    return { width: props.width, height: props.height };
  } else {
    return {
      width: Math.round(props.width * 0.8),
      height: Math.round(props.height * 0.8),
    };
  }
});

/** 加载宠物模型 */
const loadPetModel = async () => {
  if (!selectedModel.value || !petDisplayRef.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    Logger.info("PetMainDisplay: 开始加载宠物模型", selectedModel.value.name);

    await petDisplayRef.value.loadModel();
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "加载宠物模型失败";
    error.value = errorMsg;
    emit("error", errorMsg);
    Logger.error("PetMainDisplay: 加载失败", errorMsg);
  } finally {
    isLoading.value = false;
  }
};

/** 重试加载 */
const retryLoad = () => {
  error.value = null;
  loadPetModel();
};

/** 处理点击事件 */
const handleClick = () => {
  emit("click");

  if (props.isSmallMode && selectedModel.value) {
    showRipple.value = true;
    setTimeout(() => {
      showRipple.value = false;
    }, 600);

    if (petDisplayRef.value) {
      playRandomInteraction();
    }
  }
};

/** 播放随机交互 */
const playRandomInteraction = () => {
  if (!petDisplayRef.value) return;

  const actions = ["motion", "expression"];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];

  if (randomAction === "motion") {
    petDisplayRef.value.playMotion("idle", 0);
  } else {
    petDisplayRef.value.playExpression(0);
  }
};

/** 模型加载完成 */
const onModelLoaded = (modelInfo: ModelInfo) => {
  Logger.info("PetMainDisplay: 模型加载完成", selectedModel.value?.name);

  if (selectedModel.value) {
    petManager.cacheModelInfo(selectedModel.value, modelInfo);
  }

  emit("loaded", modelInfo);
};

/** 模型加载错误 */
const onModelError = (errorMsg: string) => {
  error.value = errorMsg;
  emit("error", errorMsg);
};

watch(
  selectedModel,
  async (newModel) => {
    if (newModel) {
      await nextTick();
      await loadPetModel();
    } else {
      error.value = null;
    }
  },
  { immediate: false },
);

watch(
  () => props.isSmallMode,
  async () => {
    if (selectedModel.value && petDisplayRef.value) {
      await nextTick();
      petDisplayRef.value.resize();
    }
  },
);

onMounted(async () => {
  await petManager.init();

  if (selectedModel.value) {
    await nextTick();
    await loadPetModel();
  }
});

defineExpose({
  loadPetModel,
  retryLoad,
  playRandomInteraction,
  getSelectedModel: () => selectedModel.value,
});
</script>

<style scoped>
.pet-main-display {
  position: relative;
  display: inline-block;
  border-radius: 50%;
  overflow: visible;
}

.pet-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.default-logo {
  cursor: pointer;
}

.default-logo img {
  border-radius: 50%;
  transition: transform 0.2s ease;
  user-select: none;
  -webkit-user-drag: none;
}

.default-logo:hover img {
  transform: scale(1.05);
}

.default-logo:active img {
  transform: scale(0.95);
}

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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
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
  font-size: 12px;
}
</style>
