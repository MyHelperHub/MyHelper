<template>
  <div class="menu-container">
    <div class="menu-list">
      <div class="menu-item">常用网站</div>
      <div class="menu-item">常用软件</div>
      <div class="menu-item">桌面便签</div>
      <div class="menu-item">定时计时器</div>
      <div class="menu-item">CHATGPT</div>
      <div class="menu-item">使用教程</div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="less">
.menu-container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(230, 235, 240, 0.7);
  border-radius: 20px;
  background: linear-gradient(#e5edf1, #9fc0cf);
  list-style-type: none;
  -webkit-font-smoothing: antialiased;
  position: relative; 

  .menu-list {
    border-top: 1px solid rgba(0, 0, 0, 0.7);
    margin-top: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .menu-item {
      width: 80%;
      height: 30px;
      margin: 13px 0;
      padding-left: 5px;
      display: flex;
      align-items: center;
      background-color: #9fc0cf;
      position: relative; 
      transition: background-color 0.2s ease-out;

      &:hover {
        background-color: rgb(54, 56, 55);
        z-index: 2;
        /* 使用相对定位 */
        top: 0;
        left: 0;
        /* 移除宽度和高度变化 */
        height: 30px;
        width: 80%;
        transition: background-color 0.2s ease-out;
      }
    }
  }
}
</style>
