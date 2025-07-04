<template>
  <div class="text-panel">
    <!-- 右键菜单 -->
    <ContextMenu
      ref="contextMenuRef"
      :model="menuItems"
      :pt="{
        root: { style: 'width: 120px; min-width: 120px' },
      }" />

    <!-- 添加文本按钮 -->
    <div v-if="!editingId" class="add-section" @click="addItem">
      <div class="add-icon">
        <i class="pi pi-plus"></i>
      </div>
      <span class="add-text">添加文本</span>
    </div>

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
          class="list-card input-theme"
          @click="pasteTo(item)"
          @contextmenu.prevent="(e) => handleContextMenu(e, item)">
          <!-- 内容区域 -->
          <div class="card-content">
            <div v-if="editingId !== item.id" class="text-display">
              {{ item.text || "空内容" }}
            </div>
            <input
              v-else
              v-model="item.text"
              class="text-input"
              placeholder="输入文本内容..."
              :data-id="item.id"
              @blur="save"
              @keyup.enter="save" />
          </div>

          <!-- 操作区域 -->
          <div v-if="editingId !== item.id" class="card-actions">
            <button
              class="action-btn edit-btn"
              @click.stop="editItem(item.id)"
              v-tooltip="'编辑'">
              <i class="pi pi-pencil"></i>
            </button>
            <button
              class="action-btn delete-btn"
              @click.stop="deleteItem(item.id)"
              v-tooltip="'删除'">
              <i class="pi pi-trash"></i>
            </button>
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

.add-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border: 1.5px dashed rgba(79, 109, 245, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

  .add-icon {
    width: 20px;
    height: 20px;
    border-radius: 6px;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 10px;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .add-text {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.3px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.6);
    border-color: rgba(79, 109, 245, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 109, 245, 0.15);

    .add-icon {
      transform: scale(1.1) rotate(90deg);
    }
  }
}

.text-list {
  flex: 1;

  .list-card:hover .card-actions {
    opacity: 1;
    transform: translateX(0);
  }

  .card-content {
    flex: 1;
    min-width: 0;
    margin-left: 8px;

    .text-display {
      font-size: 12px;
      color: #374151;
      line-height: 1.4;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      letter-spacing: 0.2px;
    }

    .text-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(79, 109, 245, 0.3);
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 12px;
      color: #374151;
      font-weight: 500;
      outline: none;
      transition: all 0.3s ease;

      &:focus {
        border-color: #4facfe;
        box-shadow: 0 0 0 2px rgba(79, 109, 245, 0.2);
        background: rgba(255, 255, 255, 0.95);
      }

      &::placeholder {
        color: #9ca3af;
        font-weight: 400;
      }
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transform: translateX(8px);
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);

    .action-btn {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: bold;
      transition: all 0.2s ease;

      &.edit-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }
      }

      &.delete-btn {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;

        &:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(245, 87, 108, 0.4);
        }
      }
    }
  }
}
</style>
