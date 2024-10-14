<template>
  <div class="common-text">
    <NFloatButton v-if="!editingId" class="add-button" @click="addItem">
      <Add class="image" />
    </NFloatButton>
    <div ref="scrollContainer" class="scroll-container">
      <div v-for="item in formData" :key="item.id" class="item">
        <div
          v-if="editingId !== item.id"
          class="text"
          @click="handleClick(item)">
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
          <NIcon size="small" title="编辑" @click="editItem(item.id)">
            <CreateOutline />
          </NIcon>
          <NIcon size="small" title="删除" @click="deleteItem(item.id)">
            <TrashOutline />
          </NIcon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NFloatButton, NIcon } from "naive-ui";
import { commonTextItem } from "@/interface/quickInput";
import { invoke } from "@tauri-apps/api/core";
import { nextTick, ref } from "vue";
import { Add, CreateOutline, TrashOutline } from "@vicons/ionicons5";
import { getConfig, setConfig } from "@/utils/config";
import { showMessage } from "@/utils/message";

const formData = ref<commonTextItem[]>([]);

/** 使用一个 ref 变量来跟踪当前正在编辑的项的 ID */
const editingId = ref<number | null>(null);
const scrollContainer = ref<string | HTMLElement | undefined>();

const init = async () => {
  try {
    formData.value = await getConfig(["quickInputConfig", "commonText"]);
    if (!formData.value) {
      formData.value = [];
    }
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
      `input[data-id='${id}']`
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
  await setConfig(["quickInputConfig", "commonText"], formData.value);
};

/** 处理复制到剪贴板的功能 */
const handleClick = (item: commonTextItem) => {
  invoke("write_clipboard", { text: item.text }).then(() => {
    invoke("paste");
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
      height: 30px;
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
        transition: opacity 0.3s ease, visibility 0.3s ease;
        position: absolute;
        right: 10px;
        top: 5px;
        gap: 4px;
        z-index: 2;

        button {
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
        }
      }
    }
  }

  .add-button {
    position: fixed;
    right: 35px;
    bottom: 35px;
    z-index: 1;
  }
}
</style>
