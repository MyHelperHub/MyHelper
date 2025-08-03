<template>
  <div class="pet-component">
    <PetDisplay
      :model-config="props.modelConfig"
      :width="props.width"
      :height="props.height"
      @loaded="onModelLoaded"
      @error="onError" />
  </div>
</template>

<script setup lang="ts">
import type { ModelConfig, ModelInfo } from "@/composables/useLive2D";
import PetDisplay from "./PetDisplay.vue";

interface Props {
  modelConfig: ModelConfig;
  width?: number;
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  width: 80,
  height: 80,
});

const emit = defineEmits<{
  loaded: [modelInfo: ModelInfo];
  error: [error: string];
}>();

const onModelLoaded = (modelInfo: ModelInfo) => {
  emit("loaded", modelInfo);
};

const onError = (error: string) => {
  emit("error", error);
};
</script>

<style scoped>
.pet-component {
  display: inline-block;
}
</style>
