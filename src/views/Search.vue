<template>
  <div class="search-container">
    <div class="search-list" @click="showDropdown = !showDropdown">
      <img
        class="search-img"
        :src="selectedEngine.logo"
        :alt="selectedEngine.title"
        :title="selectedEngine.title" />
      <transition name="slide-down">
        <div v-if="showDropdown" class="dropdown-list">
          <div
            v-for="(engine, index) in searchEngines"
            :key="index"
            class="dropdown-item"
            @click="selectEngine(engine)">
            <img :src="engine.logo" :alt="engine.title" :title="engine.title" />
          </div>
        </div>
      </transition>
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
const searchData = ref("");
const showDropdown = ref(false);
/** 搜索引擎列表 */
const searchEngines = [
  {
    title: "baidu",
    logo: "src/assets/images/engine/baidu.png",
    url: "https://www.baidu.com/s?wd=",
    handleSearch: (data) => {
      ipcOpen(`https://www.baidu.com/s?wd=${data}`);
    },
  },
  {
    title: "bing",
    logo: "src/assets/images/engine/bing.png",
    url: "https://bing.com/search?q=",
    handleSearch: (data) => {
      ipcOpen(`https://bing.com/search?q=${data}`);
    },
  },
  {
    title: "google",
    logo: "src/assets/images/engine/google.png",
    url: "https://www.google.com/search?q=",
    handleSearch: (data) => {
      ipcOpen(`https://www.google.com/search?q=${data}`);
    },
  },
  {
    title: "yahoo",
    logo: "src/assets/images/engine/yahoo.png",
    url: "https://search.yahoo.com/search?p=",
    handleSearch: (data) => {
      ipcOpen(`https://search.yahoo.com/search?p=${data}`);
    },
  },
];
/** 当前选择的搜索引擎 */
const selectedEngine = ref(searchEngines[0]);

const selectEngine = (engine) => {
  selectedEngine.value = engine;
};

function handleSearch() {
  selectedEngine.value.handleSearch(searchData.value);
  searchData.value = "";
}
</script>

<style lang="less">
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

    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      width: auto;
      background-color: #fff;
      border: 1px solid #ccc;
      z-index: 2;

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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease-in-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-30%);
  opacity: 0;
}
</style>
