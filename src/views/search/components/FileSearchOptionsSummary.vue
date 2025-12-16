<template>
  <div class="file-search-summary" @click="$emit('open-config')">
    <div class="summary-row">
      <i class="pi pi-folder-open summary-icon"></i>
      <span class="summary-text">{{ pathsSummary }}</span>
    </div>
    <div v-if="hasFilters" class="summary-row">
      <i class="pi pi-filter summary-icon"></i>
      <span class="summary-text">{{ filtersSummary }}</span>
    </div>
    <div class="config-btn">
      <i class="pi pi-cog"></i>
      <span>配置</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  options: {
    type: Object,
    required: true,
  },
});

defineEmits(["open-config"]);

const pathsSummary = computed(() => {
  const count = props.options.paths.length;
  if (count === 1) {
    return props.options.paths[0];
  }
  return `${count} 个路径`;
});

const hasFilters = computed(() => {
  return (
    props.options.fileType ||
    (props.options.extension && props.options.extension.length > 0) ||
    props.options.hidden ||
    props.options.noIgnore ||
    props.options.caseSensitive ||
    props.options.isGlob
  );
});

const filtersSummary = computed(() => {
  const filters = [];

  if (props.options.fileType) {
    const typeNames = {
      file: "文件",
      directory: "目录",
      symlink: "链接",
      executable: "可执行",
    };
    filters.push(typeNames[props.options.fileType] || props.options.fileType);
  }

  if (props.options.extension && props.options.extension.length > 0) {
    filters.push(props.options.extension.slice(0, 2).join(", "));
  }

  if (props.options.isGlob) filters.push("正则");
  if (props.options.hidden) filters.push("隐藏");
  if (props.options.caseSensitive) filters.push("区分大小写");

  return filters.join(" · ");
});
</script>

<style lang="less" scoped>
.file-search-summary {
  padding: 6px;
  min-width: 160px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(
      var(--theme-primary-rgb),
      var(--theme-transparency-border)
    );

    .config-btn {
      color: var(--theme-primary);
    }
  }

  .summary-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;

    .summary-icon {
      font-size: 11px;
      color: var(--theme-text-muted);
      flex-shrink: 0;
    }

    .summary-text {
      font-size: 11px;
      color: var(--theme-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .config-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 5px 10px;
    margin-top: 3px;
    background: rgba(
      var(--theme-primary-rgb),
      var(--theme-transparency-border)
    );
    border-radius: 4px;
    color: var(--theme-text-secondary);
    font-size: 10px;
    font-weight: 500;
    transition: all 0.2s ease;

    i {
      font-size: 9px;
    }
  }
}
</style>
