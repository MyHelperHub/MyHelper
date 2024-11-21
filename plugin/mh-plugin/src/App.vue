<template>
   <Toast />
  <div class="my-plugin">
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <h3>mh-plugin</h3>
    <Button @click="handleClick">
      你好
    </Button>
  </div>
</template>
<script setup lang="ts">
import Toast from 'primevue/toast';
import Button from "primevue/button";
import { useToast } from 'primevue/usetoast';
//注意：引入地址中的@/是以根目录下的src为基准
import { ipcCloseWindow } from '@/api/ipc/window.api';
const toast = useToast();
const handleClick = () => {
  toast.add({
    severity: 'success',
    summary: 'MyHelper',
    detail: '欢迎使用myhelper!',
    life: 3000
  });
}
const handleClose = () => {
  ipcCloseWindow();
};
</script>
<style lang="less" scoped>
.my-plugin {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 10px;
  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    z-index: 1;
  }
}
</style>
