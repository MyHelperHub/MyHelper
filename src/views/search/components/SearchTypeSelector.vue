<template>
  <div class="search-type-selector">
    <div class="selector-header">
      <span class="selector-title">搜索类型</span>
    </div>
    <div class="selector-options">
      <div
        v-for="type in searchTypes"
        :key="type.value"
        class="type-option"
        :class="{ active: modelValue === type.value }"
        @click="selectType(type.value)">
        <i :class="type.icon" class="type-icon"></i>
        <span class="type-label">{{ type.label }}</span>
        <i
          v-if="modelValue === type.value"
          class="pi pi-check type-check"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "web",
  },
});

const emit = defineEmits(["update:modelValue"]);

const searchTypes = [
  {
    label: "网页搜索",
    value: "web",
    icon: "pi pi-globe",
  },
  {
    label: "本地文件",
    value: "file",
    icon: "pi pi-folder",
  },
];

const selectType = (value) => {
  emit("update:modelValue", value);
};
</script>

<style lang="less" scoped>
.search-type-selector {
  padding: 8px;
  min-width: 160px;

  .selector-header {
    padding: 6px 8px 8px;
    border-bottom: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));

    .selector-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--theme-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .selector-options {
    padding-top: 4px;

    .type-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        background: rgba(
          var(--theme-primary-rgb),
          var(--theme-transparency-border)
        );
      }

      &.active {
        background: rgba(var(--theme-primary-rgb), 0.15);

        .type-icon {
          color: var(--theme-primary);
        }

        .type-label {
          color: var(--theme-primary);
          font-weight: 600;
        }
      }

      .type-icon {
        font-size: 14px;
        color: var(--theme-text-secondary);
        transition: color 0.2s ease;
      }

      .type-label {
        flex: 1;
        font-size: 13px;
        color: var(--theme-text);
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .type-check {
        font-size: 12px;
        color: var(--theme-primary);
      }
    }
  }
}
</style>
