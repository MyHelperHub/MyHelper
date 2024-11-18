<template>
  <div class="my-plugin">
    好吧
    <div class="b-red">imp</div>
    <Button
      icon="pi pi-github"
      class="p-button-rounded p-button-text p-button-plain" 
      @click="op"/>
  </div>
</template>
<script setup lang="ts">
import Button from "primevue/button";

const op = () => {
  console.log("op");
}
</script>
<style lang="less" scoped>
.my-plugin {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
}
</style>
