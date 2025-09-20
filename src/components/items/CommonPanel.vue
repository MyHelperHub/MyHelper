<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :dismissableMask="true"
    :closable="false"
    :showHeader="false"
    :style="dialogStyle">
    <div class="panel">
      <ContextMenu
        ref="contextMenuRef"
        :model="menuItems"
        :pt="{
          root: { style: 'width: 120px; min-width: 120px' },
        }" />

      <div class="grid-3">
        <div
          v-for="item in dataList"
          :key="item.id"
          class="feature-card hover-lift"
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
          @contextmenu.prevent="(e) => handleContextMenu(e, item, (item) => $emit('editItem', item), (id) => $emit('deleteItem', id))">
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

        <ItemFormModal
          v-if="mode === 'web'"
          ref="itemFormRef"
          :mode="mode"
          @addWebItem="$emit('addWebItem', $event)"
          @editWebItem="$emit('editWebItem', $event)">
          <div class="feature-card add-card hover-lift">
            <div class="icon-container">
              <i class="pi pi-plus"></i>
            </div>
            <div class="card-title">添加</div>
          </div>
        </ItemFormModal>

        <div
          v-else
          class="feature-card add-card hover-lift"
          @click="$emit('addAppItem')">
          <div class="icon-container">
            <i class="pi pi-plus"></i>
          </div>
          <div class="card-title">添加</div>
        </div>
      </div>

      <ItemFormModal
        v-if="mode === 'app'"
        ref="itemFormRef"
        :mode="mode"
        @editAppItem="$emit('editAppItem', $event)">
      </ItemFormModal>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { convertFileSrc } from "@tauri-apps/api/core";
import { ref, computed } from "vue";
import { SelectItem } from "@/types/common";
import ItemFormModal from "@/components/items/ItemFormModal.vue";
import ContextMenu from "primevue/contextmenu";
import Dialog from "primevue/dialog";
import {
  contextMenuRef,
  menuItems,
  handleContextMenu,
} from "./utils/contextMenu";

interface Props {
  mode: 'app' | 'web';
  dataList: SelectItem[];
  modelValue: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits([
  'update:modelValue',
  'openItem',
  'addAppItem',
  'addWebItem',
  'editWebItem',
  'editAppItem',
  'editItem',
  'deleteItem'
]);

const itemFormRef = ref<InstanceType<typeof ItemFormModal> | null>(null);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const dialogStyle = computed(() => {
  return props.mode === 'app'
    ? { top: '120px', left: '15px' }
    : { top: '60px', left: '15px' };
});

const defaultIcon = computed(() => {
  return props.mode === 'app' ? 'pi pi-desktop' : 'pi pi-image';
});

const openEditModal = (item: SelectItem) => {
  itemFormRef.value?.openModal(item);
};

defineExpose({
  openEditModal
});
</script>

<style lang="less">
.panel {
  .grid-3 {
    max-height: 200px;
  }

  .card-title {
    max-width: 100%;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-height: 1.2;
    max-height: calc(1.2em * 3);
  }

  .feature-card {
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));

    &:hover {
      background: rgba(
        var(--theme-background-secondary-rgb),
        var(--theme-transparency-background-secondary)
      );
      box-shadow: var(--theme-shadow-md);
      border-color: var(--theme-primary);
    }
  }

  .add-card {
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border: 1px dashed var(--theme-primary);

    &:hover {
      background: rgba(
        var(--theme-background-secondary-rgb),
        var(--theme-transparency-background-secondary)
      );
      border: 1px dashed var(--theme-primary-dark);
      box-shadow: var(--theme-shadow-sm);
    }

    .icon-container {
      color: var(--theme-primary);
    }
  }
}

.web-panel .add-card {
  background: rgba(var(--theme-primary-rgb), 0.08);
  border: 1px dashed
    rgba(var(--theme-primary-rgb), var(--theme-transparency-border));

  &:hover {
    background: rgba(var(--theme-primary-rgb), 0.12);
    border: 1px dashed
      rgba(
        var(--theme-primary-rgb),
        calc(var(--theme-transparency-border) * 1.5)
      );
    box-shadow: var(--theme-shadow-sm);
  }

  .icon-container {
    color: var(--theme-primary);
    background: rgba(
      var(--theme-background-rgb),
      var(--theme-transparency-background-secondary)
    );
  }
}
</style>