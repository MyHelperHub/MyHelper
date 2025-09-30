<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :dismissableMask="true"
    :closable="false"
    :showHeader="false"
    :autoZIndex="false"
    :pt="{
      mask: { style: { zIndex: 1002 } },
      root: { style: { zIndex: 1003 } },
    }"
    ref="dialogRef">
    <div class="panel">
      <ContextMenu
        ref="contextMenuRef"
        :model="menuItems"
        :pt="{
          root: { style: 'width: 120px; min-width: 120px' },
        }" />

      <!-- 内容区域 -->
      <div class="content-area">
        <div v-if="dataList.length === 0" class="empty-state">
          <i :class="defaultIcon"></i>
          <span>暂无内容</span>
        </div>

        <div
          v-else-if="currentDisplayMode === DisplayModeEnum.List"
          class="list-container">
          <div
            v-for="item in dataList"
            :key="item.id"
            class="list-item"
            v-tooltip.bottom="{
              value: item.title,
              showDelay: 200,
              pt: {
                text: {
                  style: {
                    fontSize: '12px',
                  },
                },
              },
            }"
            @click="$emit('openItem', item)"
            @contextmenu.prevent="
              (e) =>
                handleContextMenu(
                  e,
                  item,
                  (item) => $emit('editItem', item),
                  (id) => $emit('deleteItem', id),
                )
            ">
            <div class="list-icon-container">
              <img
                v-if="item.logo"
                :src="convertFileSrc(item.logo)"
                loading="lazy"
                class="list-icon-image" />
              <i v-else :class="defaultIcon"></i>
            </div>
            <div class="list-title">{{ item.title }}</div>
          </div>
        </div>

        <div v-else class="card-grid">
          <div
            v-for="item in dataList"
            :key="item.id"
            class="card-item"
            v-tooltip.bottom="{
              value: item.title,
              showDelay: 200,
              pt: {
                text: {
                  style: {
                    fontSize: '12px',
                  },
                },
              },
            }"
            @click="$emit('openItem', item)"
            @contextmenu.prevent="
              (e) =>
                handleContextMenu(
                  e,
                  item,
                  (item) => $emit('editItem', item),
                  (id) => $emit('deleteItem', id),
                )
            ">
            <div class="icon-container">
              <img
                v-if="item.logo"
                :src="convertFileSrc(item.logo)"
                loading="lazy"
                class="icon-image" />
              <i v-else :class="defaultIcon"></i>
            </div>
            <div class="card-title">{{ item.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- 悬浮在dialog外部的添加按钮 -->
  <Teleport to="body">
    <div v-if="visible" class="external-add-button">
      <div class="external-btn" @click="handleAddClick">
        <i class="pi pi-plus"></i>
        <span>添加</span>
      </div>
    </div>
  </Teleport>

  <!-- 统一的ItemFormModal -->
  <ItemFormModal
    ref="itemFormRef"
    :mode="mode"
    @addWebItem="$emit('addWebItem', $event)"
    @editWebItem="$emit('editWebItem', $event)"
    @editAppItem="$emit('editAppItem', $event)" />
</template>

<script setup lang="ts">
import { convertFileSrc } from "@tauri-apps/api/core";
import { ref, computed } from "vue";
import { SelectItem } from "@/types/common";
import ItemFormModal from "@/components/items/ItemFormModal.vue";
import ContextMenu from "primevue/contextmenu";
import Dialog from "primevue/dialog";
import { DisplayModeEnum, ItemTypeEnum } from "@/types/enum";
import { PathHandler } from "@/utils/pathHandler";
import {
  contextMenuRef,
  menuItems,
  handleContextMenu,
} from "./utils/contextMenu";

interface Props {
  mode: ItemTypeEnum;
  dataList: SelectItem[];
  modelValue: boolean;
  displayMode?: DisplayModeEnum;
}

const props = defineProps<Props>();
const emit = defineEmits([
  "update:modelValue",
  "openItem",
  "addAppItem",
  "addWebItem",
  "editWebItem",
  "editAppItem",
  "editItem",
  "deleteItem",
]);

const itemFormRef = ref<InstanceType<typeof ItemFormModal> | null>(null);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (value && itemFormRef.value) {
      itemFormRef.value.closeModal?.();
    }
    emit("update:modelValue", value);
  },
});

const currentDisplayMode = computed(
  () => props.displayMode ?? DisplayModeEnum.List,
);

const defaultIcon = computed(() => {
  return props.mode === ItemTypeEnum.App ? "pi pi-desktop" : "pi pi-image";
});

const openEditModal = (item: SelectItem) => {
  itemFormRef.value?.openModal(item);
};

const handleAddClick = () => {
  if (props.mode === ItemTypeEnum.Web) {
    const defaultItem = PathHandler.createDefaultItem();
    itemFormRef.value?.openModal(defaultItem);
  } else {
    emit("addAppItem");
  }
};

defineExpose({
  openEditModal,
});
</script>

<style lang="less">
.panel {
  position: relative;
  width: 220px;
  min-height: 160px;

  .content-area {
    max-height: 280px;
    padding: 8px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--theme-text-muted-rgb), 0.3) transparent;

    &::-webkit-scrollbar {
      width: 3px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: rgba(var(--theme-text-muted-rgb), 0.3);
      border-radius: 2px;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: var(--theme-text-muted);

    i {
      font-size: 24px;
      margin-bottom: 6px;
      opacity: 0.5;
    }

    span {
      font-size: 12px;
      font-weight: 500;
    }
  }

  .list-container {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .list-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border: 1px solid rgba(var(--theme-border-rgb), 0.06);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: rgba(
        var(--theme-background-secondary-rgb),
        var(--theme-transparency-background-secondary)
      );
      border-color: rgba(var(--theme-primary-rgb), 0.15);
    }

    .list-icon-container {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 8px;
      background: rgba(var(--theme-primary-rgb), 0.08);
      border-radius: 4px;

      .list-icon-image {
        width: 16px;
        height: 16px;
        object-fit: contain;
        border-radius: 2px;
      }

      i {
        font-size: 12px;
        color: var(--theme-primary);
      }
    }

    .list-title {
      flex: 1;
      font-size: 12px;
      font-weight: 500;
      color: var(--theme-text);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .card-item {
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 8px;
    border-radius: 6px;
    text-align: center;

    &:hover {
      background: rgba(
        var(--theme-background-secondary-rgb),
        var(--theme-transparency-background-secondary)
      );
      border-color: var(--theme-primary);
    }

    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin: 0 auto 4px auto;
      background: rgba(var(--theme-primary-rgb), 0.08);
      border-radius: 6px;

      .icon-image {
        width: 24px;
        height: 24px;
        object-fit: contain;
        border-radius: 3px;
      }

      i {
        font-size: 16px;
        color: var(--theme-primary);
      }
    }

    .card-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--theme-text);
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      line-height: 1.2;
    }
  }
}

.external-add-button {
  position: fixed;
  bottom: 20px;
  left: 0;
  width: 100vw;
  display: flex;
  justify-content: center;
  z-index: 1102;

  .external-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--theme-primary);
    color: white;
    border-radius: 20px;
    cursor: pointer;
    border: none;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover {
      background: var(--theme-primary-dark, var(--theme-primary));
    }
  }
}
</style>
