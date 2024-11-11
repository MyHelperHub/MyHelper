<template>
  <div class="open-app">
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
        @contextmenu.prevent="(e) => showContextMenu(e, item)"
        @click="openApp(item.src)">
        <img v-if="item.logo" :src="convertFileSrc(item.logo)" class="image" />
        <i v-else class="pi pi-image"></i>
        <div class="text">{{ item.title }}</div>
      </div>
      <div class="item" @click="addAppItem">
        <i class="pi pi-plus image"></i>
        <div class="text">添加</div>
      </div>
    </div>
    <EditItem ref="editItemRef" @editAppItem="editAppItem"></EditItem>
  </div>
</template>

<script setup lang="ts">
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getConfig, setConfig } from "@/utils/config.ts";
import { showContextMenu } from "@/views/app/utils/contextMenu.ts";
import { ref } from "vue";
import { AppItem } from "@/interface/app";
import { showMessage } from "@/utils/message";
import { emit, on } from "@/utils/eventBus";
import { ipcDeleteIcon, ipcGetAppIcon, ipcOpen } from "@/api/ipc/launch.api";
import EditItem from "./EditItem.vue";

const dataList = ref<AppItem[]>([]);
const editItemRef = ref<InstanceType<typeof EditItem> | null>(null);

const init = async () => {
  try {
    dataList.value = await getConfig(["appConfig", "dataList"]);
    if (!dataList.value) {
      dataList.value = [];
    }
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }
  // 通过事件总线传递方法
  on("edit-appItem", openEditAppItem);
  on("delete-appItem", deleteAppItem);
};
init();

/** 打开应用 */
const openApp = async (path: string) => {
  ipcOpen(path)
    .then(() => {
      emit("closeAllMenu");
    })
    .catch(() => {
      showMessage("打开失败!", 3000, 2);
    });
};

/** 添加应用 */
const addAppItem = async () => {
  const newItem: AppItem = {
    id: Date.now(),
    src: "",
    title: "",
    logo: "",
  };

  const filePath = (await open({
    multiple: false,
    directory: false,
  })) as string;

  const formattedFilePath = filePath.replace(/\\/g, "/");
  // 设置应用路径
  newItem.src = formattedFilePath;

  // 获取文件名
  let fileName = formattedFilePath.substring(
    formattedFilePath.lastIndexOf("/") + 1,
  );

  // 去除 .exe 后缀 (如果存在)
  if (fileName.toLowerCase().endsWith(".exe")) {
    fileName = fileName.slice(0, -4);
  }

  // 设置应用标题
  newItem.title = fileName;

  try {
    // 获取应用图标
    newItem.logo = (await ipcGetAppIcon(filePath)) as string;

    // 更新 dataList 并保存
    dataList.value.push(newItem);
    await setConfig(["appConfig", "dataList"], dataList.value);
  } catch (error) {
    showMessage("添加应用失败!", 3000, 2);
  }
};

const openEditAppItem = (item: AppItem) => {
  editItemRef.value?.openModal(item);
};

const deleteAppItem = async (id: number) => {
  // 找到要删除的元素索引
  const index = dataList.value.findIndex((item) => item.id === id);
  // 如果找到了，则删除该元素
  if (index !== -1) {
    //暂存logo文件名
    const filePath = dataList.value[index].logo;
    const fileName = dataList.value[index].logo.substring(filePath.lastIndexOf('\\') + 1);
    dataList.value.splice(index, 1);
    // 将数据存储到本地配置中
    try {
      await setConfig(["appConfig", "dataList"], dataList.value);
      await ipcDeleteIcon(fileName, 1);
      showMessage("删除成功!", 3000, 1);
    } catch (error) {
      showMessage("删除失败!", 3000, 2);
    }
  }
};

const editAppItem = async (updatedItem: AppItem) => {
  // 找到要更新的网站的索引
  const index = dataList.value.findIndex((item) => item.id === updatedItem.id);
  if (index !== -1) {
    // 使用新的数据更新 dataList 中的对应项
    dataList.value[index] = updatedItem;

    // 更新本地配置
    try {
      await setConfig(["appConfig", "dataList"], dataList.value);
      showMessage("更新成功!", 3000, 1);
    } catch (error) {
      showMessage("更新失败!", 3000, 2);
    }
  } else {
    showMessage("更新失败!", 3000, 2);
  }
};
</script>

<style lang="less" scoped>
.open-app {
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
