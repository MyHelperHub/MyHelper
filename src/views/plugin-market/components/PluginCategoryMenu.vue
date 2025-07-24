<template>
  <div class="category-menu">
    <Card class="menu-card">
      <template #title>
        <div class="card-title">插件分类</div>
      </template>
      <template #content>
        <div class="menu-wrapper">
          <Listbox
            :model-value="selectedCategory"
            :options="categoryMenuItems"
            optionLabel="label"
            optionValue="value"
            class="category-menu-list"
            @update:model-value="$emit('select-category', $event)" />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import Listbox from "primevue/listbox";
import type { CategoryMenuItem } from "@/interface/pluginMarket.d";

interface Props {
  selectedCategory: string;
  categoryMenuItems: CategoryMenuItem[];
}

interface Emits {
  (e: 'select-category', category: string): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style lang="less" scoped>
.category-menu {
  width: 12rem;
  flex: none;
  overflow-y: hidden;

  .menu-card {
    :deep(.p-card) {
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .card-title {
      padding: 0 0.75rem;
      color: var(--theme-text) !important;
      font-weight: 600;
    }

    :deep(.p-listbox-list-container) {
      overflow: hidden;
      width: 100%;
      max-height: unset !important;
    }
  }
}
</style>