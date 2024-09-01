<template>
  <div class="home">
    <div class="brand">
      <img class="logo" src="/logo.png" data-tauri-drag-region />
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="less">
.home {
  background-color: red;
  width: 100%;
  height: 100%;

  .brand {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    .logo {
      height: 50px;
      width: 50px;
      border-radius: 50%;
      border: 4px solid rgba(230, 235, 240, .8);
      z-index: 1;
    }
  }
}
</style>