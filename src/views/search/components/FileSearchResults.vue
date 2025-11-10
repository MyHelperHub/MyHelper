<template>
  <div v-if="results.length > 0" class="file-search-results">
    <div class="results-header">
      <span class="results-count">找到 {{ results.length }} 个结果</span>
      <i class="pi pi-times close-btn" @click="$emit('close')"></i>
    </div>

    <div class="results-list">
      <div
        v-for="(result, index) in results"
        :key="index"
        v-tooltip="{ value: getTooltipContent(result), escape: false, showDelay: 300 }"
        class="result-item"
        @click="openFile(result)">
        <div class="result-icon">
          <i :class="getFileIcon(result)"></i>
        </div>
        <div class="result-info">
          <div class="result-name">{{ result.name }}</div>
          <div class="result-path">{{ result.path }}</div>
        </div>
        <div class="result-meta">
          <span v-if="result.size" class="result-size">{{
            formatFileSize(result.size)
          }}</span>
        </div>
      </div>
    </div>
  </div>

  <div
    v-else-if="isSearching"
    class="file-search-results file-search-loading">
    <div class="loading-content">
      <i class="pi pi-spin pi-spinner loading-icon"></i>
      <span class="loading-text">搜索中...</span>
    </div>
  </div>

  <div v-else-if="showEmpty" class="file-search-results file-search-empty">
    <i class="pi pi-times close-btn-empty" @click="$emit('close')"></i>
    <div class="empty-content">
      <i class="pi pi-search empty-icon"></i>
      <span class="empty-text">未找到匹配的文件</span>
    </div>
  </div>
</template>

<script setup>
import { ipcOpen } from "@/api/ipc/launch.api";
import { formatFileSize } from "@/utils/pluginUtils";

const props = defineProps({
  results: {
    type: Array,
    default: () => [],
  },
  isSearching: {
    type: Boolean,
    default: false,
  },
  showEmpty: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const getFileIcon = (result) => {
  if (result.fileType === "directory") {
    return "pi pi-folder";
  }

  const ext = result.name.split(".").pop()?.toLowerCase();
  const iconMap = {
    txt: "pi pi-file",
    doc: "pi pi-file-word",
    docx: "pi pi-file-word",
    pdf: "pi pi-file-pdf",
    xls: "pi pi-file-excel",
    xlsx: "pi pi-file-excel",
    png: "pi pi-image",
    jpg: "pi pi-image",
    jpeg: "pi pi-image",
    gif: "pi pi-image",
    svg: "pi pi-image",
    mp4: "pi pi-video",
    mp3: "pi pi-volume-up",
    zip: "pi pi-file-zip",
    rar: "pi pi-file-zip",
  };

  return iconMap[ext] || "pi pi-file";
};

const openFile = (result) => {
  ipcOpen(result.path);
};

const getTooltipContent = (result) => {
  const parts = [
    `<strong>名称：</strong>${result.name}`,
    `<strong>路径：</strong>${result.path}`,
  ];

  if (result.size) {
    parts.push(`<strong>大小：</strong>${formatFileSize(result.size)}`);
  }

  if (result.isHidden) {
    parts.push(`<strong>隐藏文件</strong>`);
  }

  return parts.join("<br>");
};
</script>

<style lang="less" scoped>
.file-search-results {
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  background: rgba(
    var(--theme-background-card-rgb),
    var(--theme-transparency-card)
  );
  border: 1px solid
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
  border-radius: var(--theme-radius-md);
  box-shadow: var(--theme-shadow-lg);
  max-height: 300px;
  width: 230px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .results-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-bottom: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));

    .results-count {
      font-size: 11px;
      font-weight: 600;
      color: var(--theme-text-secondary);
    }

    .close-btn {
      font-size: 12px;
      color: var(--theme-text-muted);
      cursor: pointer;
      transition: color 0.2s ease;
      padding: 3px;
      border-radius: 3px;

      &:hover {
        color: var(--theme-text);
        background: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
      }
    }
  }

  .results-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;

    .result-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(
          var(--theme-primary-rgb),
          var(--theme-transparency-border)
        );
      }

      .result-icon {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(
          var(--theme-primary-rgb),
          var(--theme-transparency-border)
        );
        border-radius: 5px;

        i {
          font-size: 14px;
          color: var(--theme-primary);
        }
      }

      .result-info {
        flex: 1;
        min-width: 0;

        .result-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--theme-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-path {
          font-size: 10px;
          color: var(--theme-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 2px;
        }
      }

      .result-meta {
        flex-shrink: 0;

        .result-size {
          font-size: 10px;
          color: var(--theme-text-muted);
          font-weight: 500;
        }
      }
    }
  }

  &.file-search-loading,
  &.file-search-empty {
    .loading-content,
    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      gap: 10px;

      .loading-icon,
      .empty-icon {
        font-size: 28px;
        color: var(--theme-text-muted);
      }

      .loading-text,
      .empty-text {
        font-size: 12px;
        color: var(--theme-text-secondary);
      }
    }
  }

  &.file-search-empty {
    position: relative;

    .close-btn-empty {
      position: absolute;
      top: 10px;
      right: 12px;
      font-size: 12px;
      color: var(--theme-text-muted);
      cursor: pointer;
      transition: color 0.2s ease;
      padding: 3px;
      border-radius: 3px;

      &:hover {
        color: var(--theme-text);
        background: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
      }
    }
  }
}
</style>

<style lang="less">
.p-tooltip {
  .p-tooltip-text {
    font-size: 11px;
    line-height: 1.6;
    max-width: 400px;
    word-break: break-all;

    strong {
      color: var(--theme-primary);
      font-weight: 600;
    }
  }
}
</style>
