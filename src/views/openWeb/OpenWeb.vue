<template>
  <div class="open-web">
    <div class="list">
      <div class="item" v-for="(item, index) in dataList" :key="index" @click="navigateTo(item.url)" :title="item.title"
        @contextmenu.prevent="(e) => showContextMenu(e, item)">
        <img :src="convertFileSrc(item.logo) ? convertFileSrc(item.logo) : 'src/assets/images/defaultImage.svg'"
          class="image" />
        <div class="text">{{ item.title }}</div>
      </div>
      <AddItem @addWebItem="addWebItem">
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
import { convertFileSrc } from "@tauri-apps/api/core";
import { deleteConfig, getConfig, setConfig } from "@/utils/config";
import { open } from "@tauri-apps/plugin-shell";
import { ref } from "vue";
import { WebItem } from "@/interface/web";
import { showMessage } from "@/utils/message";
import { showContextMenu } from "@/utils/contextMenu"
const dataList = ref<WebItem[]>([]);

const init = async () => {
  try {
    dataList.value = await getConfig(["webConfig", "dataList"]);
  } catch (error) {
    showMessage("操作配置时出错!", 3000, 2);
  }
};
init();
/** 跳转到指定链接 */
const navigateTo = (url: string) => {
  // 检查 URL 是否以 http:// 或 https:// 开头
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`; // 默认添加 http://
  }
  open(url);
}

const addWebItem = (item: any) => {
  dataList.value.push(item);
  setConfig(["webConfig", "dataList"], dataList.value).catch(() => {
    showMessage("保存失败!", 3000, 2);
  });
}
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
        max-width: 40px;
        font-size: 12px;
        overflow: hidden;
        white-space: nowrap;
      }
    }
  }
}
</style>
