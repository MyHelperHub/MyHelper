<template>
  <div class="my-plugin">
    <Drawer v-model:visible="popoverRef" position="bottom" style="height: 60%">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-bold">常用软件</span>
        </div>
      </template>

      <div class="icons-container">
        <div v-for="i in 8" :key="i" class="icon-wrapper">
          <i class="icon">
            <img 
              src="../../assets/images/engine/baidu.png" 
              alt="icon"
            />
          </i>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import Drawer from "primevue/drawer";
import { ref } from "vue";

const popoverRef = ref(false);

const openPopover = () => {
  popoverRef.value = true;
};

defineExpose({ openPopover });
</script>

<style lang="less">
@import "../../assets/css/variable.less";
.icons-container {
  display: flex;
  flex-wrap: wrap;
  padding: 1rem;
  gap: 1rem;
}

.icon-wrapper {
  width: calc(25% - 0.75rem); /* 4个图标等分,减去间距 */
  display: flex;
  justify-content: center;
}

.icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  cursor: pointer;
}
</style>
