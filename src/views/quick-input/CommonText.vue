<template>
  <div class="common-text">
    <div v-if="!editingId" class="add-button" @click="addItem">
      <i class="pi pi-plus image"></i>
    </div>
    <div ref="scrollContainer" class="scroll-container">
      <div
        v-for="item in formData"
        :key="item.id"
        class="item"
        @click="pasteTo(item)">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { QuickInputItem } from "@/interface/quickInput";
import { nextTick, ref } from "vue";
import { getConfig, setConfig } from "@/utils/config";
import { showMessage } from "@/utils/message";
import { ipcPaste, ipcWriteClipboard } from "@/api/ipc/clipboard.api";

const formData = ref<QuickInputItem[]>([]);

/** 使用一个 ref 变量来跟踪当前正在编辑的项的 ID */
const editingId = ref<number | null>(null);
const scrollContainer = ref<string | HTMLElement | undefined>();

const init = async () => {
  try {
    const config = await getConfig<QuickInputItem[]>(
      "quickInputConfig.commonText",
    );
    formData.value = config || [];
  } catch (error) {
    showMessage("初始化数据失败，请重置数据!", 3000, 2);
  }
};
init();

/** 删除项 */
const deleteItem = (id: number) => {
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

  // 滚动到顶部并打开新项的编辑模式
  nextTick().then(() => {
    const container = scrollContainer.value as HTMLElement;
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth", // 平滑滚动效果
      });

      // 使用 requestAnimationFrame 等待滚动结束再获取焦点
      const checkIfScrolled = () => {
        if (container.scrollTop === 0) {
          // 滚动到达顶部后，执行聚焦逻辑
          editItem(newItem.id);
        } else {
          // 若未滚动到顶部，继续检查
          requestAnimationFrame(checkIfScrolled);
        }
      };

      requestAnimationFrame(checkIfScrolled);
    }
  });
};

const save = async () => {
  editingId.value = null;
  await setConfig("quickInputConfig.commonText", formData.value);
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

  .scroll-container {
    overflow-y: auto;
    max-height: 280px;
    min-height: 280px;

    &::-webkit-scrollbar {
      display: none;
    }

    .item {
      position: relative;
      height: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f2f4f5;
      border: 1px solid #dcdcdc;
      border-radius: 5px;
      padding: 8px;
      transition: background-color 0.3s;
      margin: 6px 0;
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
        right: 10px;
        top: 5px;
        gap: 4px;
        z-index: 2;
      }
    }
  }

  .add-button {
    position: fixed;
    background: white;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    right: 35px;
    bottom: 35px;
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
