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
      // color: rgb(28, 31, 30);

      .text {
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
          background-color: rgb(245, 245, 245);
          z-index: 2;
          transition: background-color 0.2s ease-out;
        }
      }

      /* 上半部分的竖线 */
      &::before {
        content: '';
        width: 2px;
        /* 竖线的宽度 */
        height: 13px;
        /* 初始高度为0 */
        background-color: rgb(54, 56, 55);
        /* 竖线的颜色 */
        position: absolute;
        left: 15px;
        /* 定位在左侧 */
        top: 20px;
        /* 初始位置在中间 */
        transition: height 0.2s ease-out, top 0.2s ease-out;
      }

      /* 下半部分的竖线 */
      &::after {
        content: '';
        width: 2px;
        /* 竖线的宽度 */
        height: 13px;
        /* 初始高度为0 */
        background-color: rgb(54, 56, 55);
        /* 竖线的颜色 */
        position: absolute;
        left: 15px;
        /* 定位在左侧 */
        bottom: 20px;
        /* 初始位置在中间 */
        transition: height 0.2s ease-out, bottom 0.2s ease-out;
      }

      &:hover::before {
        height: 24px;
      }

      &:hover::after {
        height: 24px;
      }
    }
  }
}
</style>
