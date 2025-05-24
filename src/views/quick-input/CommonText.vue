<template>
  <div class="common-text">
    <!-- 右键菜单组件 -->
    <ContextMenu
      ref="contextMenuRef"
      :model="menuItems"
      :pt="{
        root: { style: 'width: 120px; min-width: 120px' },
      }" />

    <div v-if="!editingId" class="add-button" @click="addItem">
      <i class="pi pi-plus image"></i>
    </div>

    <!-- 使用虚拟列表替换原有的滚动容器 -->
    <VirtualList
      ref="virtualListRef"
      :items="formData"
      :item-height="46"
      :container-height="280"
      key-field="id"
      :overscan="3"
      class="virtual-scroll-container">
      <template #default="{ item }">
        <div
          class="item"
          @click="pasteTo(item)"
          @contextmenu.prevent="(e) => handleContextMenu(e, item)">
          <div v-if="editingId !== item.id" class="text">
            {{ item.text ? item.text : "请输入内容..." }}
          </div>
          <input
            v-else
            v-model="item.text"
            class="input"
            placeholder="请输入内容..."
            :data-id="item.id"
            @blur="save"
            @keyup.enter="save" />
          <div v-if="editingId !== item.id" class="action-buttons">
            <i
              class="pi pi-pen-to-square"
              style="font-size: 0.8rem"
              title="编辑"
              @click.stop="editItem(item.id)"></i>
            <i
              class="pi pi-trash"
              style="font-size: 0.8rem"
              title="删除"
              @click.stop="deleteItem(item.id)"></i>
          </div>
        </div>
      </template>
    </VirtualList>
  </div>
</template>

<script setup lang="ts">
import { QuickInputItem } from "@/interface/quickInput";
import { nextTick, ref } from "vue";
import { getConfig, setConfig } from "@/utils/config";
import { showMessage } from "@/utils/message";
import { ipcPaste, ipcWriteClipboard } from "@/api/ipc/clipboard.api";
import { on } from "@/utils/eventBus";
import VirtualList from "@/components/VirtualList.vue";
import ContextMenu from "primevue/contextmenu";
import {
  contextMenuRef,
  menuItems,
  handleContextMenu,
} from "./utils/contextMenu";

const formData = ref<QuickInputItem[]>([]);

/** 使用一个 ref 变量来跟踪当前正在编辑的项的 ID */
const editingId = ref<number | null>(null);
const virtualListRef = ref<InstanceType<typeof VirtualList>>();

const init = async () => {
  try {
    const config = await getConfig<{ commonText: QuickInputItem[] }>(
      "quickInputConfig",
    );
    formData.value = config?.commonText || [];
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }

  // 通过事件总线监听右键菜单事件
  on("edit-quickInputItem", editItemFromContextMenu);
  on("delete-quickInputItem", deleteItem);
};
init();

/** 从右键菜单触发的编辑功能 */
const editItemFromContextMenu = (item: QuickInputItem) => {
  editItem(item.id);
};

/** 删除项 */
const deleteItem = (idOrItem: number | QuickInputItem) => {
  const id = typeof idOrItem === "number" ? idOrItem : idOrItem.id;
  formData.value = formData.value.filter((item) => item.id !== id);
  save();
};

const editItem = (id: number) => {
  editingId.value = id;
  nextTick(() => {
    const input = document.querySelector(
      `input[data-id='${id}']`,
    ) as HTMLInputElement;
    if (input) {
      input.focus();
    }
  });
};

/** 添加项 */
const addItem = () => {
  const newItem = {
    id: Date.now(),
    text: "",
  };

  // 将新项插入到 formData 顶部
  formData.value.unshift(newItem);

  // 使用虚拟列表的滚动到顶部方法
  nextTick().then(() => {
    if (virtualListRef.value) {
      virtualListRef.value.scrollToTop("smooth");

      // 等待滚动完成后再聚焦
      setTimeout(() => {
        editItem(newItem.id);
      }, 100);
    }
  });
};

const save = async () => {
  editingId.value = null;
  await setConfig("quickInputConfig", { commonText: formData.value });
};

/** 处理复制到剪贴板的功能 */
const pasteTo = (item: QuickInputItem) => {
  ipcWriteClipboard(item.text).then(() => {
    ipcPaste();
  });
};
</script>

<style lang="less">
.common-text {
  gap: 5px;
  margin: 0 10px;

  .virtual-scroll-container {
    margin: 3px 0;
  }

  .item {
    position: relative;
    height: 34px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f2f4f5;
    border: 1px solid #dcdcdc;
    border-radius: 5px;
    padding: 6px 8px;
    transition: background-color 0.3s;
    margin: 3px 0;
    cursor: pointer;

    .text {
      font-size: 12px;
      margin: 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      text-overflow: ellipsis;
    }

    .input {
      width: 100%;
      font-size: 12px;
      border: 1px solid #dcdcdc;
      border-radius: 5px;
      padding: 4px;
    }

    &:hover {
      background-color: #e6e9ed;

      .action-buttons {
        opacity: 1;
        visibility: visible;
        background-color: #e6e9ed;
      }
    }

    .action-buttons {
      display: flex;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 0.3s ease,
        visibility 0.3s ease;
      position: absolute;
      right: 8px;
      top: 2px;
      gap: 3px;
      z-index: 2;
    }
  }

  .add-button {
    position: absolute;
    background: white;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    right: 15px;
    bottom: 15px;
    z-index: 1;
    box-shadow: 0 2px 8px 0px rgba(0, 0, 0, 0.16);
    transition: 0.3s;
    cursor: pointer;

    &:hover {
      background: rgb(237, 237, 237);
      box-shadow: 0 2px 12px 0px rgba(0, 0, 0, 0.24);
    }
  }
}
</style>
