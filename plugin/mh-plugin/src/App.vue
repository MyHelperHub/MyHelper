<template>
  <Toast />
  <div class="my-plugin">
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <h3>mh-plugin</h3>
    <Button @click="handleClick"> 你好 </Button>
    <p>{{ config }}</p>
  </div>
</template>
<script setup lang="ts">
import Toast from "primevue/toast";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import {
  closeWindow,
  getSelfConfig,
  setSelfConfig,
} from "./plugin-api/plugin.api";
import { ref } from "vue";
const toast = useToast();

const config = ref<Awaited<ReturnType<typeof getSelfConfig>>>("");

const init = async () => {
  await setSelfConfig(["config"], "我是持久化的配置");
  config.value = await getSelfConfig(["config"]);
};
init();

const handleClick = () => {
  toast.add({
    severity: "success",
    summary: "MyHelper",
    detail: "欢迎使用myhelper!",
    life: 3000,
  });
};
const handleClose = () => {
  closeWindow();
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
