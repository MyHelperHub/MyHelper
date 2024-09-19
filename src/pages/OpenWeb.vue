<template>
  <div class="open-web">
    <div class="list">
      <div class="item">
        <img src="../assets/images/engine/baidu.png" class="image" />
        <div class="text">CSDN</div>
      </div>
      <div class="item">
        <img src="../assets/images/add.svg" class="image" />
        <div class="text">添加</div>
      </div>
      
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="less" scoped>
.open-web {
  position: absolute;
  left: -15px;
  background-color: rgb(242, 244, 253);
  width: 220px;
  height: fit-content;
  border-radius: 10px;
  z-index: 2;
  cursor: default;
  .list {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap; 
    gap: 13px;
    margin: 15px 20px;
    overflow: auto;
    max-height: 145px;

    // 隐藏滚动条
    &::-webkit-scrollbar {
      display: none; 
    }
    .item {
        width: 40px;
        height: 50px;
        min-width: 40px;
        min-height: 50px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 5px;
        background-color: rgb(255, 255, 255);
        cursor: pointer;
      .image {
        width: 32px;
        height: 32px;
      }
      .text {
        display: flex;
        justify-content: center;
        margin-top: 2px;
        max-width: 40px;
        font-size: 12px;
        overflow: hidden;
        white-space: nowrap;

      }
    }
  }
}
</style>
