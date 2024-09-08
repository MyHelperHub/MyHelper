<template>
  <div class="menu-container">
    <div class="menu-list">
      <div class="menu-item">
        <div class="text">常用网站</div>
      </div>
      <div class="menu-item">
        <div class="text">常用软件</div>
      </div>
      <div class="menu-item">
        <div class="text">桌面便签</div>
      </div>
      <div class="menu-item">
        <div class="text">定时计时器</div>
      </div>
      <div class="menu-item">
        <div class="text">CHATGPT</div>
      </div>
      <div class="menu-item">
        <div class="text">使用教程</div>
      </div>
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
      position: relative;
      display: flex;
      justify-content: center;
      width: 100%;
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
      transition: 0.3s;
      color: rgb(28, 31, 30);

      .text {
        width: 80%;
        height: 30px;
        margin: 13px 0;
        padding-left: 5px;
        display: flex;
        align-items: center;
        // background-color: #9fc0cf;
        position: relative;
        transition: background-color 0.2s ease-out;

        &:hover {
          background-color: rgb(245, 245, 245);
          z-index: 2;
          transition: background-color 0.2s ease-out;
        }

        &::before,
        &::after {
          content: '';
          position: absolute;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: rgb(54, 56, 55);
          transform-origin: left;
          transform: scaleX(0);
          transition: transform 0.2s ease-out;
        }

        &::before {
          top: 0;
        }

        &::after {
          bottom: 0;
        }

        &:hover::before,
        &:hover::after {
          transform: scaleX(1);
        }
      }

      &::before,
      &::after {
        content: '';
        width: 2px;
        height: 13px;
        background-color: rgb(54, 56, 55);
        position: absolute;
        left: 15px;
        transition: height 0.2s ease-out, top 0.2s ease-out;
      }

      &::before {
        top: 20px;
      }

      &::after {
        bottom: 20px;
      }

      &:hover::before,
      &:hover::after {
        height: 24px;
      }

    }
  }
}
</style>
