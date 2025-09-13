<template>
  <div class="text-panel">
    <!-- 右键菜单 -->
    <ContextMenu
      ref="contextMenuRef"
      :model="menuItems"
      :pt="{
        root: { style: 'width: 120px; min-width: 120px' },
      }" />

    <!-- 添加文本按钮 - 移除原来的位置 -->

    <!-- 文本列表 -->
    <VirtualList
      ref="virtualListRef"
      :items="formData"
      :item-height="52"
      :container-height="240"
      key-field="id"
      :overscan="3"
      class="text-list">
      <template #default="{ item }">
        <div
          class="theme-list-card quick-input-item"
          @click="pasteTo(item)"
          @contextmenu.prevent="(e) => handleContextMenu(e, item)">
          <!-- 简单图标 -->
          <div class="item-icon">
            <i class="pi pi-file"></i>
          </div>

          <!-- 内容区域 -->
          <div class="item-content">
            <div v-if="editingId !== item.id" class="item-text">
              {{ item.text || "空内容" }}
            </div>
            <InputText
              v-else
              v-model="item.text"
              class="item-input"
              placeholder="输入文本内容..."
              :data-id="item.id"
              @blur="save"
              @keyup.enter="save" />
          </div>
        </div>
      </template>
    </VirtualList>

    <!-- 固定在右下角的添加按钮 -->
    <div class="floating-add-button" @click="addItem">
      <div class="fab-icon">
        <i class="pi pi-plus"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QuickInputItem } from "@/interface/quickInput";
import { nextTick, ref } from "vue";
import { getConfig, setConfig } from "@/utils/config";
import { showMessage } from "@/composables/message.ts";
import { ipcPaste, ipcWriteClipboard } from "@/api/ipc/clipboard.api";
import { on } from "@/utils/eventBus";
import VirtualList from "@/components/VirtualList.vue";
import ContextMenu from "primevue/contextmenu";
import InputText from "primevue/inputtext";
import {
  contextMenuRef,
  menuItems,
  handleContextMenu,
} from "./utils/contextMenu";

const formData = ref<QuickInputItem[]>([]);
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

  on("edit-quickInputItem", editItemFromContextMenu);
  on("delete-quickInputItem", deleteItem);
};
init();

const editItemFromContextMenu = (item: QuickInputItem) => {
  editItem(item.id);
};

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

const addItem = () => {
  const newItem = {
    id: Date.now(),
    text: "",
  };

  formData.value.unshift(newItem);

  nextTick().then(() => {
    if (virtualListRef.value) {
      virtualListRef.value.scrollToTop("smooth");
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

const pasteTo = (item: QuickInputItem) => {
  ipcWriteClipboard(item.text).then(() => {
    ipcPaste();
  });
};
</script>

<style lang="less">
.text-panel {
  padding: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-list {
  flex: 1;

  .quick-input-item {
    width: 100%;
    margin-bottom: 6px;

    .item-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--theme-text-muted);
      font-size: 12px;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .item-content {
      flex: 1;
      min-width: 0;
      margin-left: 6px;

      .item-text {
        font-size: 13px;
        color: var(--theme-text);
        line-height: 1.4;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        letter-spacing: 0.2px;
      }

      .item-input {
        width: 100%;
        background: rgba(var(--theme-background-card-rgb), 0.9);
        border: 1px solid var(--theme-border);
        border-radius: 6px;
        padding: 6px 8px;
        font-size: 13px;
        color: var(--theme-text);
        font-weight: 500;
        outline: none;
        transition: all 0.3s ease;

        &:focus {
          border-color: var(--theme-primary);
          box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.1);
          background: rgba(var(--theme-background-card-rgb), 1);
        }

        &::placeholder {
          color: var(--theme-text-muted);
          font-weight: 400;
        }
      }
    }

    &:hover .item-icon {
      color: var(--theme-primary);
    }
  }
}

/* 浮动按钮样式 */
.floating-add-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--theme-primary) 0%,
    var(--theme-primary-light) 100%
  );
  box-shadow:
    0 4px 16px rgba(var(--theme-primary-rgb), 0.3),
    0 2px 8px rgba(var(--theme-text-rgb), 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  z-index: 10;

  .fab-icon {
    color: var(--theme-background);
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow:
      0 6px 20px rgba(var(--theme-primary-rgb), 0.4),
      0 4px 12px rgba(var(--theme-text-rgb), 0.15);

    .fab-icon {
      transform: rotate(90deg);
    }
  }

  &:active {
    transform: translateY(0) scale(0.95);
    box-shadow:
      0 2px 8px rgba(var(--theme-primary-rgb), 0.3),
      0 1px 4px rgba(var(--theme-text-rgb), 0.1);
  }
}
</style>
