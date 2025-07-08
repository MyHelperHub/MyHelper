<template>
  <div class="search-container">
    <div
      class="search-wrapper backdrop-blur-sm bg-white/40 rounded-xl border border-white/30">
      <!-- 搜索引擎选择器 -->
      <div class="engine-selector" @click="popoverRef?.toggle($event)">
        <div class="engine-icon-wrapper">
          <img
            class="engine-icon"
            :src="selectedEngine.logo"
            :alt="selectedEngine.title" />
          <div class="engine-indicator" :class="{ open: isPopoverOpen }">
            <i class="pi pi-chevron-down"></i>
          </div>
        </div>

        <Popover
          ref="popoverRef"
          append-to="body"
          @show="isPopoverOpen = true"
          @hide="isPopoverOpen = false"
          :pt="{
            root: {
              style: {
                marginTop: '2px',
              },
            },
          }">
          <div
            class="engine-dropdown backdrop-blur-md bg-white/80 rounded-lg border border-white/30">
            <div
              v-for="(engine, index) in searchEngines"
              :key="index"
              class="engine-option"
              @click.stop="selectEngine(engine)">
              <img :src="engine.logo" :alt="engine.title" class="option-icon" />
              <span class="option-title">{{ engine.title }}</span>
              <i
                v-if="selectedEngine.title === engine.title"
                class="pi pi-check option-check"></i>
            </div>
          </div>
        </Popover>
      </div>

      <!-- 搜索输入框 -->
      <div class="search-input-wrapper">
        <input
          v-model="searchData"
          class="search-input"
          placeholder="搜索任何内容..."
          spellcheck="false"
          @keydown.enter="handleSearch" />

        <button
          class="search-button"
          :class="{ active: searchData.length > 0 }"
          @click="handleSearch">
          <i class="pi pi-search"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ipcOpen } from "@/api/ipc/launch.api";
import Popover from "primevue/popover";

const searchData = ref("");
const selectedEngine = ref(null);
const popoverRef = ref(null);
const isPopoverOpen = ref(false);

/** 搜索引擎列表 */
const searchEngines = [
  {
    title: "Baidu",
    logo: new URL("../assets/images/engine/baidu.png", import.meta.url).href,
    url: "https://www.baidu.com/s?wd=",
    handleSearch: (data) => {
      ipcOpen(`https://www.baidu.com/s?wd=${data}`);
    },
  },
  {
    title: "Google",
    logo: new URL("../assets/images/engine/google.png", import.meta.url).href,
    url: "https://www.google.com/search?q=",
    handleSearch: (data) => {
      ipcOpen(`https://www.google.com/search?q=${data}`);
    },
  },
  {
    title: "Bing",
    logo: new URL("../assets/images/engine/bing.png", import.meta.url).href,
    url: "https://bing.com/search?q=",
    handleSearch: (data) => {
      ipcOpen(`https://bing.com/search?q=${data}`);
    },
  },
  {
    title: "Yahoo",
    logo: new URL("../assets/images/engine/yahoo.png", import.meta.url).href,
    url: "https://search.yahoo.com/search?p=",
    handleSearch: (data) => {
      ipcOpen(`https://search.yahoo.com/search?p=${data}`);
    },
  },
];

/** 默认选中的搜索引擎 */
selectedEngine.value = searchEngines[0];

const selectEngine = (engine) => {
  selectedEngine.value = engine;
  popoverRef.value.hide();
};

function handleSearch() {
  if (searchData.value.trim()) {
    selectedEngine.value.handleSearch(searchData.value.trim());
    searchData.value = "";
  }
}
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
    position: relative;

    &:hover {
      background: rgba(255, 255, 255, 0.5);
      box-shadow: 0 4px 12px rgba(79, 109, 245, 0.15);
    }

    &:focus-within {
      background: rgba(255, 255, 255, 0.6);
      box-shadow: 0 0 0 2px rgba(79, 109, 245, 0.3);
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
      background: rgba(255, 255, 255, 0.5);
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

      .engine-indicator {
        display: flex;
        align-items: center;
        color: #64748b;
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
    margin-left: 8px;

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      color: #2d3748;
      padding: 6px 8px;
      border-radius: 6px;
      transition: all 0.2s ease;

      &::placeholder {
        color: #94a3b8;
        font-weight: 400;
      }

      &:focus {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    .search-button {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 50%;
      background: linear-gradient(135deg, #4f6df5, #764ba2);
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      opacity: 0.7;

      &:hover {
        opacity: 1;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(79, 109, 245, 0.3);
      }

      &:active {
        transform: scale(0.95);
      }

      &.active {
        opacity: 1;
        box-shadow: 0 2px 8px rgba(79, 109, 245, 0.2);
      }
    }
  }
}

// 搜索引擎下拉菜单样式
.engine-dropdown {
  padding: 8px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

  .engine-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      background: rgba(79, 109, 245, 0.1);
    }

    .option-icon {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .option-title {
      flex: 1;
      font-size: 13px;
      color: #374151;
      font-weight: 500;
    }

    .option-check {
      font-size: 12px;
      color: #4f6df5;
    }
  }
}

// Popover样式覆盖
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
</style>
