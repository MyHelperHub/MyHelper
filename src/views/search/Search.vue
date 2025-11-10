<template>
  <div class="search-container">
    <div class="search-wrapper">
      <!-- 搜索引擎/类型选择器 -->
      <div class="engine-selector" @click="popoverRef?.toggle($event)">
        <div class="engine-icon-wrapper">
          <img
            v-if="state.searchType === 'web'"
            class="engine-icon"
            :src="state.selectedEngine.logo"
            :alt="state.selectedEngine.title" />
          <i v-else class="pi pi-folder engine-icon-fallback"></i>
          <div class="engine-indicator" :class="{ open: state.isPopoverOpen }">
            <i class="pi pi-chevron-down"></i>
          </div>
        </div>

        <Popover
          ref="popoverRef"
          append-to="body"
          @show="state.isPopoverOpen = true"
          @hide="state.isPopoverOpen = false"
          :pt="{
            root: {
              style: {
                marginTop: '2px',
              },
            },
          }">
          <div class="popover-content">
            <!-- 搜索类型选择器 -->
            <SearchTypeSelector v-model="state.searchType" />

            <!-- 分隔线 -->
            <div class="popover-divider"></div>

            <!-- 搜索引擎列表 (仅网页搜索时显示) -->
            <div v-if="state.searchType === 'web'" class="engine-dropdown">
              <div
                v-for="(engine, index) in searchEngines"
                :key="index"
                class="engine-option"
                @click.stop="selectEngine(engine)">
                <img
                  :src="engine.logo"
                  :alt="engine.title"
                  class="option-icon" />
                <span class="option-title">{{ engine.title }}</span>
                <i
                  v-if="state.selectedEngine.title === engine.title"
                  class="pi pi-check option-check"></i>
              </div>
            </div>

            <!-- 文件搜索选项摘要 (仅文件搜索时显示) -->
            <FileSearchOptionsSummary
              v-if="state.searchType === 'file'"
              :options="fileSearch.options"
              @open-config="openOptionsDialog" />
          </div>
        </Popover>
      </div>

      <!-- 搜索输入框 -->
      <div class="search-input-wrapper">
        <input
          v-model="state.searchData"
          class="search-input"
          :placeholder="
            state.searchType === 'web' ? '搜索任何内容...' : '搜索本地文件...'
          "
          spellcheck="false"
          @keydown.enter="handleSearch" />

        <i
          ref="searchButtonRef"
          class="pi pi-search search-button"
          :class="{ active: state.searchData.length > 0 }"
          @click="handleSearchButtonClick"
          aria-label="搜索"></i>
      </div>
    </div>

    <!-- 文件搜索结果 Popover -->
    <Popover
      v-if="state.searchType === 'file'"
      ref="resultsPopoverRef"
      append-to="body"
      :pt="{
        root: {
          style: {
            marginTop: '8px',
            marginBottom: '12px',
            left: '50% !important',
            transform: 'translateX(-50%)',
          },
        },
      }">
      <FileSearchResults
        :results="fileSearch.results"
        :is-searching="fileSearch.isSearching"
        :show-empty="fileSearch.showEmpty"
        @close="clearFileSearch" />
    </Popover>

    <!-- 文件搜索选项 Dialog -->
    <Dialog
      v-model:visible="state.showOptionsDialog"
      modal
      dismissableMask
      header="文件搜索配置"
      :style="{ width: '92%', maxWidth: '230px', maxHeight: '360px' }"
      :pt="{
        root: { class: 'search-options-dialog' },
        header: { class: 'dialog-header' },
        content: { class: 'dialog-content' },
      }">
      <FileSearchOptions v-model="fileSearch.options" />
    </Dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { ipcOpen } from "@/api/ipc/launch.api";
import { ipcFdSearch } from "@/api/ipc/fdSearch.api";
import { desktopDir } from "@tauri-apps/api/path";
import { Logger } from "@/utils/logger";
import Popover from "primevue/popover";
import Dialog from "primevue/dialog";
import SearchTypeSelector from "./components/SearchTypeSelector.vue";
import FileSearchResults from "./components/FileSearchResults.vue";
import FileSearchOptions from "./components/FileSearchOptions.vue";
import FileSearchOptionsSummary from "./components/FileSearchOptionsSummary.vue";

const searchEngines = Object.freeze([
  {
    title: "Baidu",
    logo: new URL("../../assets/images/engine/baidu.png", import.meta.url).href,
    url: "https://www.baidu.com/s?wd=",
    handleSearch: (data) => ipcOpen(`https://www.baidu.com/s?wd=${data}`),
  },
  {
    title: "Google",
    logo: new URL("../../assets/images/engine/google.png", import.meta.url).href,
    url: "https://www.google.com/search?q=",
    handleSearch: (data) => ipcOpen(`https://www.google.com/search?q=${data}`),
  },
  {
    title: "Bing",
    logo: new URL("../../assets/images/engine/bing.png", import.meta.url).href,
    url: "https://bing.com/search?q=",
    handleSearch: (data) => ipcOpen(`https://bing.com/search?q=${data}`),
  },
  {
    title: "Yahoo",
    logo: new URL("../../assets/images/engine/yahoo.png", import.meta.url).href,
    url: "https://search.yahoo.com/search?p=",
    handleSearch: (data) => ipcOpen(`https://search.yahoo.com/search?p=${data}`),
  },
]);

const state = reactive({
  searchData: "",
  searchType: "web",
  selectedEngine: searchEngines[0],
  isPopoverOpen: false,
  showOptionsDialog: false,
});

const fileSearch = reactive({
  results: [],
  isSearching: false,
  showEmpty: false,
  options: {
    paths: ["."],
    maxDepth: 10,
    hidden: false,
    noIgnore: false,
    caseSensitive: false,
    fileType: null,
    extension: [],
    isGlob: false,
  },
});

const popoverRef = ref(null);
const searchButtonRef = ref(null);
const resultsPopoverRef = ref(null);

onMounted(async () => {
  try {
    const desktop = await desktopDir();
    fileSearch.options.paths = [desktop];
  } catch (error) {
    Logger.error(error, "获取桌面路径失败");
  }
});

const selectEngine = (engine) => {
  state.selectedEngine = engine;
  popoverRef.value?.hide();
};

const openOptionsDialog = () => {
  state.showOptionsDialog = true;
  popoverRef.value?.hide();
};

const handleSearchButtonClick = (event) => {
  if (state.searchType === "web") {
    handleSearch();
  } else if (state.searchType === "file") {
    if (fileSearch.results.length > 0 || fileSearch.isSearching || fileSearch.showEmpty) {
      resultsPopoverRef.value?.toggle(event);
    } else {
      handleSearch();
    }
  }
};

const handleSearch = async () => {
  if (!state.searchData.trim()) return;

  if (state.searchType === "web") {
    state.selectedEngine.handleSearch(state.searchData.trim());
    state.searchData = "";
  } else if (state.searchType === "file") {
    await handleFileSearch();
  }
};

const handleFileSearch = async () => {
  fileSearch.isSearching = true;
  fileSearch.showEmpty = false;
  fileSearch.results = [];

  if (searchButtonRef.value) {
    resultsPopoverRef.value?.show({ currentTarget: searchButtonRef.value });
  }

  try {
    const results = await ipcFdSearch({
      paths: fileSearch.options.paths,
      pattern: state.searchData.trim(),
      isGlob: fileSearch.options.isGlob,
      hidden: fileSearch.options.hidden,
      noIgnore: fileSearch.options.noIgnore,
      maxDepth: fileSearch.options.maxDepth,
      fileType: fileSearch.options.fileType,
      extension: fileSearch.options.extension.length > 0 ? fileSearch.options.extension : undefined,
      caseSensitive: fileSearch.options.caseSensitive,
    });

    fileSearch.results = results;
    fileSearch.showEmpty = results.length === 0;
  } catch (error) {
    Logger.error(error, "文件搜索失败");
    fileSearch.showEmpty = true;
  } finally {
    fileSearch.isSearching = false;
  }
};

const clearFileSearch = () => {
  fileSearch.results = [];
  fileSearch.showEmpty = false;
  state.searchData = "";
  resultsPopoverRef.value?.hide();
};
</script>

<style lang="less">
.search-container {
  width: 100%;
  padding: 4px 0;

  .search-wrapper {
    display: flex;
    align-items: center;
    padding: 6px;
    transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(
      var(--theme-background-secondary-rgb),
      var(--theme-transparency-background-secondary)
    );
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    border-radius: var(--theme-radius-md);

    &:hover {
      box-shadow: var(--theme-shadow-sm);
    }

    &:focus-within {
      box-shadow: 0 0 0 2px rgba(var(--theme-primary-rgb), 0.3);
    }
  }

  .engine-selector {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px 8px 4px 4px;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(
        var(--theme-background-secondary-rgb),
        var(--theme-transparency-background-secondary)
      );
    }

    .engine-icon-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;

      .engine-icon {
        width: 18px;
        height: 18px;
        border-radius: 4px;
      }

      .engine-icon-fallback {
        font-size: 16px;
        color: var(--theme-primary);
      }

      .engine-indicator {
        display: flex;
        align-items: center;
        color: var(--theme-text-muted);
        font-size: 10px;

        .pi-chevron-down {
          transition: transform 0.2s ease;
        }

        &.open .pi-chevron-down {
          transform: rotate(180deg);
        }
      }
    }
  }

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;

    .search-input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      color: var(--theme-text);
      padding: 6px 8px;
      border-radius: 6px;
      transition: all 0.2s ease;

      &::placeholder {
        color: var(--theme-text-muted);
        font-weight: 400;
      }

      &:focus {
        background: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
      }
    }

    .search-button {
      margin-left: 6px;
      color: var(--theme-text-muted);
      font-size: 16px;
      cursor: pointer;
      transition:
        color 0.2s ease,
        transform 0.1s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: var(--theme-primary);
      }

      &:active {
        transform: scale(0.96);
      }

      &.active {
        color: var(--theme-primary);
      }
    }
  }
}

.popover-content {
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  background: rgba(
    var(--theme-background-card-rgb),
    var(--theme-transparency-card)
  );
  border: 1px solid
    rgba(var(--theme-border-rgb), var(--theme-transparency-border));
  border-radius: 8px;
  box-shadow: var(--theme-shadow-lg);

  .popover-divider {
    height: 1px;
    background: rgba(
      var(--theme-border-rgb),
      var(--theme-transparency-border)
    );
    margin: 4px 8px;
  }
}

.engine-dropdown {
  padding: 8px;
  min-width: 140px;

  .engine-option {
    display: flex;
    align-items: center;
    gap: 8px;
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

    .option-icon {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      border: 1px solid
        rgba(var(--theme-border-light-rgb), var(--theme-transparency-border));
    }

    .option-title {
      flex: 1;
      font-size: 13px;
      color: var(--theme-text);
      font-weight: 500;
    }

    .option-check {
      font-size: 12px;
      color: var(--theme-primary);
    }
  }
}

.p-popover {
  &:after,
  &:before {
    display: none;
  }
}

.p-popover-content {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}

.search-options-dialog {
  :deep(.dialog-header) {
    padding: 10px 12px;
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    border-bottom: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));

    .p-dialog-title {
      font-size: 12px;
      font-weight: 600;
    }
  }

  :deep(.dialog-content) {
    padding: 0;
    background: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    max-height: 300px;
    overflow-y: auto;
  }

  :deep(.p-dialog-header-close) {
    width: 24px;
    height: 24px;
    color: var(--theme-text-muted);

    &:hover {
      color: var(--theme-primary);
      background: rgba(
        var(--theme-primary-rgb),
        var(--theme-transparency-border)
      );
    }

    .p-icon {
      width: 12px;
      height: 12px;
    }
  }
}
</style>
