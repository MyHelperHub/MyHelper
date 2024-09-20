<template>
  <div class="open-web">
    <div class="list">
      <div class="item" v-for="(item, index) in listData" :key="index">
        <img :src="getImageByPath(item.logo)" class="image" />
        <div class="text">{{ item.title }}</div>
      </div>
      <AddItem>
        <div class="item">
        <img src="../assets/images/add.svg" class="image" />
        <div class="text">添加</div>
      </div>
      </AddItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import AddItem from "@/components/AddItem.vue";
import { deleteConfig, getConfig, setConfig } from "@/utils/config";
import {getImageByPath} from "@/utils/getImages"
import { ref } from "vue";

const listData = ref([
  {
    title: "百度",
    url: "http://baidu.com",
    logo: "../assets/images/engine/baidu.png",
  },
  {
    title: "百度",
    url: "http://baidu.com",
    logo: "../assets/images/engine/baidu.png",
  },
  {
    title: "百度",
    url: "http://baidu.com",
    logo: "../assets/images/engine/baidu.png",
  },
]);

const init = async () => {
  try {
    const res = await getConfig(["position", "x"]);
    console.log(res);
  } catch (error) {
    console.error("操作配置时出错:", error);
  }
};
init();
</script>
<style lang="less" scoped>
.open-web {
  position: absolute;
  left: -13px;
  background-color: rgb(242, 244, 253);
  width: 210px;
  min-height: 90px;
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
      width: 35px;
      height: 45px;
      min-width: 35px;
      min-height: 45px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 5px;
      margin-left: 2px;
      background-color: rgb(255, 255, 255);
      border-radius: 5px;
      cursor: pointer;

      .image {
        width: 28px;
        height: 28px;
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
