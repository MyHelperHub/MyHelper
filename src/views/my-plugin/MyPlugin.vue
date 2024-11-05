<template>
  <div class="my-plugin">
    <Drawer v-model:visible="popoverRef" position="bottom" style="height: 60%">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-bold">常用软件</span>
        </div>
      </template>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
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
</style>
