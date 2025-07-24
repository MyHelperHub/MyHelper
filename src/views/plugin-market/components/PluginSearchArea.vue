<template>
  <div class="search-area" data-tauri-drag-region>
    <div class="container">
      <div class="search-wrapper" data-tauri-drag-region>
        <div class="search-input">
          <InputText
            :model-value="keyword"
            placeholder="搜索插件..."
            @update:model-value="$emit('update:keyword', $event || '')"
            @keydown.enter="$emit('search')" />
          <i
            v-if="keyword"
            class="pi pi-times-circle clear-button"
            @click="$emit('clear-search')" />
          <Button
            class="search-button"
            icon="pi pi-search"
            @click="$emit('search')" />
        </div>
        <div class="button-group">
          <Button
            icon="pi pi-list"
            label="已安装插件"
            class="installed-button"
            @click="$emit('show-installed')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import InputText from "primevue/inputtext";
import Button from "primevue/button";

interface Props {
  keyword?: string;
}

interface Emits {
  (e: 'update:keyword', value: string): void;
  (e: 'search'): void;
  (e: 'clear-search'): void;
  (e: 'show-installed'): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style lang="less" scoped>
.search-area {
  background: rgba(var(--theme-background-rgb), 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--theme-border);
  padding: 1rem 0;
  color: var(--theme-text);

  .container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .search-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .search-input {
    position: relative;
    flex: 1;
    max-width: 36rem;

    :deep(.p-inputtext) {
      width: 100%;
      padding-right: 5rem;
    }

    .clear-button {
      position: absolute;
      right: 2.5rem;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      padding: 0.5rem;
      color: var(--theme-text-muted);
      z-index: 1;

      &:hover {
        color: var(--theme-primary);
      }
    }

    .search-button {
      position: absolute;
      right: 0.25rem;
      top: 50%;
      transform: translateY(-50%);
      padding: 0.5rem;
      border: none;
      background-color: transparent;
      color: var(--theme-text-muted);

      &:hover {
        color: var(--theme-primary);
        background-color: var(--theme-background-secondary);
      }

      &:focus {
        box-shadow: none;
      }
    }
  }

  .button-group {
    display: flex;
    gap: 0.5rem;

    :deep(.p-button) {
      padding: 0.4rem 0.8rem;
      font-size: 0.875rem;

      .p-button-icon {
        font-size: 0.875rem;
      }
    }

    .installed-button {
      margin-right: 0.5rem;
    }
  }
}
</style>