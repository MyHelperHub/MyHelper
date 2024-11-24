<template>
  <div class="open-web">
    <div class="list">
      <div
        v-for="item in dataList"
        :key="item.id"
        class="item"
        v-tooltip.bottom="{
          value: item.title,
          showDelay: 200,
          pt: {
            text: {
              style: {
                fontSize: '15px',
              },
            },
          },
        }"
        @click="navigateTo(item.url)"
        @contextmenu.prevent="(e) => showContextMenu(e, item)">
        <img v-if="item.logo" :src="convertFileSrc(item.logo)" class="image" />
        <i v-else class="pi pi-image"></i>
        <div class="text">{{ item.title }}</div>
      </div>
      <AddItem
        ref="addItemRef"
        @addWebItem="addWebItem"
        @editWebItem="editWebItem">
        <div class="item">
          <i class="pi pi-plus image"></i>
          <div class="text">添加</div>
        </div>
      </AddItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import AddItem from "@/views/web/AddItem.vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getConfig, setConfig } from "@/utils/config.ts";
import { ref } from "vue";
import { WebItem } from "@/interface/web";
import { showMessage } from "@/utils/message.ts";
import { showContextMenu } from "@/views/web/utils/contextMenu.ts";
import { emit, on } from "@/utils/eventBus";
import { ipcDeleteIcon, ipcOpen } from "@/api/ipc/launch.api";

const dataList = ref<WebItem[]>([]);
const addItemRef = ref<InstanceType<typeof AddItem> | null>(null);

const init = async () => {
  try {
    dataList.value = await getConfig(["webConfig", "dataList"]);
    if (!dataList.value) {
      dataList.value = [];
    }
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }
  // 通过事件总线传递方法
  on("edit-webItem", openEditWebItem);
  on("delete-webItem", deleteWebItem);
};
init();

/** 打开编辑网站弹窗 */
const openEditWebItem = async (item: WebItem) => {
  addItemRef.value?.openModal(item);
};
/** 跳转到指定链接 */
const navigateTo = (url: string) => {
  // 检查 URL 是否以 http:// 或 https:// 开头
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`; // 默认添加 http://
  }
  ipcOpen(url)
    .then(() => {
      emit("closeAllMenu");
    })
    .catch(() => {
      showMessage("打开失败!", 3000, 2);
    });
};

/** 添加网站时触发事件 */
const addWebItem = async (item: WebItem) => {
  // 使用 Date.now() 生成唯一 ID
  item.id = Date.now();
  dataList.value.push(item);
  // 将数据存储到本地配置中
  try {
    await setConfig(["webConfig", "dataList"], dataList.value);
  } catch (error) {
    dataList.value.pop();
    showMessage("保存失败!", 3000, 2);
  }
};

/** 编辑网站 */
const editWebItem = async (updatedItem: WebItem) => {
  // 找到要更新的网站的索引
  const index = dataList.value.findIndex((item) => item.id === updatedItem.id);

  if (index !== -1) {
    // 使用新的数据更新 dataList 中的对应项
    dataList.value[index] = updatedItem;

    // 更新本地配置
    try {
      await setConfig(["webConfig", "dataList"], dataList.value);
      showMessage("更新成功!", 3000, 1);
    } catch (error) {
      showMessage("更新失败!", 3000, 2);
    }
  } else {
    showMessage("更新失败!", 3000, 2);
  }
};

/** 删除某个网站 */
const deleteWebItem = async (id: number) => {
  // 找到要删除的元素索引
  const index = dataList.value.findIndex((item) => item.id === id);
  // 如果找到了，则删除该元素
  if (index !== -1) {
    //暂存logo文件名
    const filePath = dataList.value[index].logo;
    const fileName = dataList.value[index].logo.substring(
      filePath.lastIndexOf("/") + 1,
    );

    dataList.value.splice(index, 1);
    // 将数据存储到本地配置中
    try {
      await setConfig(["webConfig", "dataList"], dataList.value);
      ipcDeleteIcon(fileName, 0).catch(() => {
        showMessage("图标删除失败,不影响使用😢", 3000, 0);
      });
      showMessage("删除成功!", 3000, 1);
    } catch (error) {
      showMessage("删除失败!", 3000, 2);
    }
  }
};
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
      width: 45px;
      height: 55px;
      min-width: 45px;
      min-height: 55px;
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
        display: flex;
        align-items: center;
        justify-content: center;
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
