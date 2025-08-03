<template>
  <div class="sidebar">
    <div class="menu-header" data-tauri-drag-region>
      <Button
        icon="pi pi-arrow-left"
        class="p-button-text p-button-sm back-button"
        @click="$emit('go-back')" />
      <span>开发者插件管理</span>
    </div>
    <div class="menu-items">
      <div
        v-for="item in menuItems"
        :key="item.key"
        class="menu-item"
        :class="{ active: activeMenu === item.key }"
        @click="$emit('menu-click', item.key)">
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from "primevue/button";
import type { MenuKey } from "@/interface/pluginMarket.d";
import { MENU_ITEMS } from "@/interface/pluginMarket.d";

interface Props {
  activeMenu: MenuKey;
}

interface Emits {
  (e: "go-back"): void;
  (e: "menu-click", menuKey: MenuKey): void;
}

defineProps<Props>();
defineEmits<Emits>();

const menuItems = MENU_ITEMS;
</script>

<style lang="less" scoped>
.sidebar {
  width: 240px;
  background: var(--theme-background-card);
  border-right: 1px solid var(--theme-border);
  height: 100%;
  display: flex;
  flex-direction: column;

  .menu-header {
    display: flex;
    align-items: center;
    padding: 1rem 1.5rem;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--theme-text);
    border-bottom: 1px solid var(--theme-border);
    flex-shrink: 0;

    .back-button {
      padding: 0.3rem;
      margin-right: 0.5rem;

      &:hover {
        background: var(--theme-background-secondary);
      }
    }

    span {
      flex: 1;
    }
  }

  .menu-items {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;

    .menu-item {
      display: flex;
      align-items: center;
      padding: 0.875rem 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--theme-text-muted);
      margin: 0.2rem 0.5rem;
      border-radius: 6px;

      i {
        margin-right: 0.75rem;
        font-size: 1.1rem;
      }

      &:hover,
      &.active {
        background: rgba(var(--theme-primary-rgb), 0.1);
        color: var(--theme-primary);
      }

      &.active {
        font-weight: 500;
        border-left: 3px solid var(--theme-primary);
      }
    }
  }
}
</style>
