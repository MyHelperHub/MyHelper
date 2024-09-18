<template>
  <div class="menu-container">
    <span class="parting-line"></span>
    <Search class="search" />
    <div class="menu-list">
      <div class="menu-item">
        <div class="menu-text">常用网站</div>
      </div>
      <div class="menu-item">
        <div class="menu-text">常用软件</div>
      </div>
      <div class="menu-item">
        <div class="menu-text">桌面便签</div>
      </div>
      <div class="menu-item">
        <div class="menu-text">定时计时器</div>
      </div>
      <div class="menu-item">
        <div class="menu-text">CHATGPT</div>
      </div>
      <div class="menu-item">
        <div class="menu-text">使用教程</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Search from "@/components/search.vue";
</script>

<style lang="less" scoped>
.menu-container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(230, 235, 240, 0.7);
  border-radius: 20px;
  background: linear-gradient(#e5edf1, #9fc0cf);
  list-style-type: none;
  -webkit-font-smoothing: antialiased;

  .menu-list {
    display: flex;
    flex-wrap: wrap;
    margin: 65px 0 0 30px;

    .menu-item {
      display: inline-block;
      vertical-align: top;
      border: none;
      cursor: pointer;
      margin-top: 10px;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-51%);
        width: 2px;
        height: 30%;
        background-color: rgb(54, 56, 55);
        transition: height 0.2s 0.35s ease-out;
        z-index: 1;
      }

      &:hover {
        .menu-text {
          color: rgb(54, 56, 55);
          background-color: rgb(245, 245, 245);

          &::before {
            width: 100%;
            height: 96%;
            opacity: 1;
            transition: width 0.2s 0.1s linear, height 0.15s 0.3s ease-out,
              opacity 0s 0.1s;
          }

          &::after {
            width: 100%;
            opacity: 1;
            transition: width 0.25s 0.2s ease-out, opacity 0s 0.2s;
          }
        }

        &::before {
          height: 100%;
          transition: height 0.2s ease-in;
        }
      }

      .menu-text {
        width: 140px;
        height: 10px;
        position: relative;
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
        padding: 15px 20px;
        color: rgb(28, 31, 30);
        transition: 0.3s;

        &::before,
        &::after {
          content: "";
          position: absolute;
          left: 0;
          transition: all 0.25s ease;
          width: 0;
          height: 0;
          background: transparent;
          opacity: 0;
        }

        &::before {
          top: 0;
          border-top: 2px solid rgb(54, 56, 55);
          border-right: 2px solid rgb(54, 56, 55);
          transition: height 0.15s ease-in, width 0.2s 0.15s linear,
            opacity 0s 0.35s;
        }

        &::after {
          bottom: 0;
          border-bottom: 2px solid rgb(54, 56, 55);
          transition: width 0.25s ease-in, opacity 0s 0.35s;
        }
      }
    }
  }

  .search {
    position: relative;
    top: 72px;
  }

  .parting-line {
    position: absolute;
    top: 65px;
    width: 100%;
    margin-left: -1px;
    border: none;
    border-top: 1px solid rgba(58, 69, 80, 0.2);
  }
}
</style>