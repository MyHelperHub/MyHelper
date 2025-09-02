<template>
  <div
    class="avatar-display"
    :class="{
      'small-mode': isSmallMode,
      'large-mode': !isSmallMode,
      'has-pet': shouldShowPet,
    }"
    @click="handleClick">
    <div v-if="shouldShowPet" class="pet-container">
      <PetDisplay
        ref="petDisplayRef"
        :width="displaySize.width"
        :height="displaySize.height"
        @loaded="onModelLoaded"
        @error="onModelError" />

      <div v-if="isSmallMode" class="interaction-hint">
        <div class="click-ripple" :class="{ active: showRipple }"></div>
      </div>
    </div>

    <div v-else class="default-logo">
      <img :src="props.defaultLogo" class="logo-image" />
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-if="error" class="error-overlay" @click.stop="() => error = null">
      <i class="pi pi-refresh"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ModelInfo } from "@/interface/pet";
import PetDisplay from "@/components/Pet/PetDisplay.vue";
import { createPetManager } from "@/components/Pet/petManager";
import { Logger } from "@/utils/logger";

interface Props {
  defaultLogo?: string;
  isShowMenu?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  defaultLogo: "/logo.png",
  isShowMenu: false,
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

const petManager = createPetManager();
const selectedModel = petManager.getSelectedModelRef();
const preferences = petManager.getPreferencesRef();
const isSmallMode = computed(() => !props.isShowMenu);

// 计算是否应该显示宠物：需要启用宠物系统且有选中的模型
const shouldShowPet = computed(() => {
  return preferences.value.isEnabledPet && !!selectedModel.value;
});

const displaySize = computed(() => {
  const size = isSmallMode.value ? 60 : 40;
  return { width: size, height: size };
});


const handleClick = () => {
  emit("click");

  if (isSmallMode.value && shouldShowPet.value) {
    showRipple.value = true;
    setTimeout(() => (showRipple.value = false), 600);

    if (petDisplayRef.value) {
      const actions = ["motion", "expression"];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      if (randomAction === "motion") {
        petDisplayRef.value.playMotion("idle", 0);
      } else {
        petDisplayRef.value.playExpression(0);
      }
    }
  }
};


const onModelLoaded = (modelInfo: ModelInfo) => {
  Logger.info("AvatarDisplay: 模型加载完成", selectedModel.value?.name);
  emit("loaded", modelInfo);
};

const onModelError = (errorMsg: string) => {
  error.value = errorMsg;
  emit("error", errorMsg);
};

onMounted(() => {
  petManager.init();
});

defineExpose({
  getSelectedModel: () => selectedModel.value,
});
</script>

<style scoped>
.avatar-display {
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: visible;
  border-radius: 50%;
}

.small-mode {
  width: 60px;
  height: 60px;
}

.large-mode {
  width: 40px;
  height: 40px;
}

.pet-container,
.default-logo {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.logo-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: transform 0.2s ease;
  user-select: none;
  -webkit-user-drag: none;
  object-fit: cover;
}

.avatar-display:hover .logo-image {
  transform: scale(1.05);
}

.avatar-display:active .logo-image {
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
  width: 110%;
  height: 110%;
  opacity: 0;
}

.small-mode:hover {
  transform: scale(1.02);
  /* box-shadow: 0 4px 16px rgba(var(--theme-primary-rgb), 0.2); */
}

.small-mode:active {
  transform: scale(0.98);
}

.large-mode {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(var(--theme-background-rgb), 0.6);
  border: 1px solid rgba(var(--theme-border-rgb), 0.3);
  box-shadow: 0 2px 8px rgba(var(--theme-primary-rgb), 0.1);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(var(--theme-background-rgb), 0.8),
      rgba(var(--theme-background-secondary-rgb), 0.6)
    );
    border-radius: 50%;
    z-index: -1;
    transition: all 0.2s ease;
  }
}

.large-mode:hover {
  box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.15);
  border-color: rgba(var(--theme-primary-rgb), 0.4);
  transform: scale(1.02);

  &::before {
    background: linear-gradient(
      135deg,
      rgba(var(--theme-background-rgb), 0.9),
      rgba(var(--theme-primary-rgb), 0.1)
    );
  }
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
