<template>
  <div class="pet-page">
    <div class="page-header">
      <h2>我的宠物</h2>
      <p>选择和管理你的虚拟宠物</p>
    </div>

    <div class="pet-content">
      <PetList
        :display-width="300"
        :display-height="300"
        @model-changed="onModelChanged"
        @model-loaded="onModelLoaded"
        @model-error="onModelError" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PetList } from "@/components/Pet";
import type { ModelConfig, ModelInfo } from "@/composables/useLive2D";

// 事件处理
const onModelChanged = (model: ModelConfig | null) => {
  console.log("Pet页面: 当前选中模型", model?.name || "无");
};

const onModelLoaded = (modelInfo: ModelInfo) => {
  console.log("Pet页面: 模型加载成功", modelInfo);
};

const onModelError = (error: string) => {
  console.error("Pet页面: 模型加载失败", error);
};
</script>

<style scoped>
.pet-page {
  padding: 24px;
  min-height: 100vh;
  background: var(--theme-background, #fff);
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: var(--theme-text, #333);
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: var(--theme-text-secondary, #666);
  font-size: 16px;
}

.pet-content {
  display: flex;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
}
</style>
