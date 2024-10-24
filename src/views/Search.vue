<template>
  <div class="search-container">
    <div class="search-list" @click="popoverRef.toggle($event)">
      <img
        class="search-img"
        :src="selectedEngine.logo"
        :alt="selectedEngine.title"
        v-tooltip.bottom="{
          value: selectedEngine.title,
          showDelay: 500,
          pt: {
            text: {
              style: {
                fontSize: '15px',
              },
            },
          },
        }" />
      <Popover ref="popoverRef">
        <div class="dropdown-list">
          <div
            v-for="(engine, index) in searchEngines"
            :key="index"
            class="dropdown-item"
            v-tooltip.right="{
              value: engine.title,
              showDelay: 200,
              pt: {
                text: {
                  style: {
                    fontSize: '15px',
                  },
                },
              },
            }"
            @click="selectEngine(engine)">
            <img :src="engine.logo" :alt="engine.title" />
          </div>
        </div>
      </Popover>
    </div>
    <div class="search-control">
      <input
        v-model="searchData"
        class="search-input"
        placeholder="搜索"
        spellcheck="false"
        @keydown.enter="handleSearch" />
      <div class="search-btn" @click="handleSearch">
        <i class="pi pi-search icon"></i>
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

/** 搜索引擎列表 */
const searchEngines = [
  {
    title: "Baidu",
    logo: "src/assets/images/engine/baidu.png",
    url: "https://www.baidu.com/s?wd=",
    handleSearch: (data) => {
      ipcOpen(`https://www.baidu.com/s?wd=${data}`);
    },
  },
  {
    title: "Bing",
    logo: "src/assets/images/engine/bing.png",
    url: "https://bing.com/search?q=",
    handleSearch: (data) => {
      ipcOpen(`https://bing.com/search?q=${data}`);
    },
  },
  {
    title: "Google",
    logo: "src/assets/images/engine/google.png",
    url: "https://www.google.com/search?q=",
    handleSearch: (data) => {
      ipcOpen(`https://www.google.com/search?q=${data}`);
    },
  },
  {
    title: "Yahoo",
    logo: "src/assets/images/engine/yahoo.png",
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
  // 关闭 popover
  popoverRef.value.hide();
};

function handleSearch() {
  selectedEngine.value.handleSearch(searchData.value);
  searchData.value = "";
}
</script>

<style lang="less">
@import "../assets/css/variable.less";

.search-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .search-list {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    cursor: pointer;

    .search-img {
      width: 22px;
      height: 22px;
    }
  }

  .search-control {
    width: 80%;
    position: relative;

    .search-input {
      width: 190px;
      height: 30px;
      border-radius: 18px;
      outline: none;
      border: 1px solid #ccc;
      padding-left: 20px;
      padding-right: 40px;
      white-space: nowrap;
      overflow: hidden;
      font-size: 16px;
      font-family: inherit;
    }

    .search-btn {
      position: absolute;
      top: 5px;
      right: 15px;
      height: 20px;
      width: 20px;
      border: none;
      outline: none;
      cursor: pointer;
      background-color: transparent;

      .icon {
        fill: #000;
        width: 90%;
        height: 90%;
      }
    }
  }
}

.p-popover:after,
.p-popover:before {
  transform: translateX(-20%);
}
.p-popover-content {
  padding: 5px !important;
  .dropdown-list {
    background-color: #fff;

    .dropdown-item {
      padding: 5px 8px;
      cursor: pointer;

      &:hover {
        background-color: #f0f0f0;
      }

      img {
        width: 22px;
        height: 22px;
      }
    }
  }
}
</style>
