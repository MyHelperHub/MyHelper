<template>
  <div class="text-panel">
    <!-- 右键菜单 -->
    <ContextMenu
      ref="contextMenuRef"
      :model="menuItems"
      :pt="{
        root: { style: 'width: 120px; min-width: 120px' },
      }" />

    <!-- 文本列表 -->
    <div ref="listRef" class="text-list">
      <div
        v-for="item in filtered"
        :key="item.id"
        class="qi-row"
        @click="pasteTo(item)"
        @contextmenu.prevent="(e) => handleContextMenu(e, item)">
        <div v-if="editingId !== item.id" class="row-text">
          {{ item.text || "空内容" }}
        </div>
        <InputText
          v-else
          v-model="item.text"
          class="row-input"
          placeholder="输入文本内容..."
          :data-id="item.id"
          @blur="save"
          @keyup.enter="save" />
      </div>
    </div>

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
import { nextTick, ref, computed } from "vue";
import { getConfig, setConfig } from "@/utils/config";
import { showMessage } from "@/composables/message.ts";
import { ipcPaste, ipcWriteClipboard } from "@/api/ipc/clipboard.api";
import { on } from "@/utils/eventBus";
import ContextMenu from "primevue/contextmenu";
import InputText from "primevue/inputtext";
import {
  contextMenuRef,
  menuItems,
  handleContextMenu,
} from "./utils/contextMenu";

const props = defineProps<{ query?: string }>();
const editingId = ref<number | null>(null);
const listRef = ref<HTMLElement | null>(null);
const formData = ref<QuickInputItem[]>([]);

const filtered = computed(() => {
  const q = (props.query || "").trim().toLowerCase();
  if (!q) return formData.value;
  return formData.value.filter((i) => (i.text || "").toLowerCase().includes(q));
});

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
    if (listRef.value) {
      listRef.value.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => editItem(newItem.id), 100);
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

const getFilteredCount = () => filtered.value.length;
defineExpose({ getFilteredCount });
</script>

<style lang="less">
.text-panel {
  padding: 8px;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
}

.text-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  .qi-row {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 10px;
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    border-radius: 8px;
    background: transparent;
    transition:
      background 0.15s ease,
      border-color 0.15s ease;
    cursor: pointer;
    height: 36px;
  }

  .qi-row:hover {
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border-color: rgba(var(--theme-primary-rgb), 0.35);
  }

  .row-text {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--theme-text);
    font-weight: 500;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0.2px;
  }

  .row-input {
    width: 100%;
    height: 28px;
    background: rgba(var(--theme-background-card-rgb), 1);
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 13px;
    color: var(--theme-text);
    font-weight: 500;
    outline: none;
    transition: all 0.15s ease;

    &:focus {
      border-color: var(--theme-primary);
      box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.08);
      background: rgba(var(--theme-background-card-rgb), 1);
    }

    &::placeholder {
      color: var(--theme-text-muted);
      font-weight: 400;
    }
  }
}

.text-list {
  overflow-y: auto;
  scrollbar-gutter: stable both-edges;
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
