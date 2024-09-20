<template>
  <div class="search-container">
    <div class="search-list" @click="showDropdown = !showDropdown">
      <img
        class="search-img"
        :src="getImageByPath(selectedEngine.logo)"
        :alt="selectedEngine.title"
        :title="selectedEngine.title" />
      <transition name="slide-down">
        <div class="dropdown-list" v-if="showDropdown">
          <div
            class="dropdown-item"
            v-for="(engine, index) in searchEngines"
            :key="index"
            @click="selectEngine(engine)">
            <img :src="getImageByPath(engine.logo)" :alt="engine.title" :title="engine.title" />
          </div>
        </div>
      </transition>
    </div>
    <div class="search-control">
      <input
        v-model="searchData"
        class="search-input"
        placeholder="搜索"
        @keydown.enter="handleSearch"
        spellcheck="false" />
      <div class="search-btn" @click="handleSearch">
        <img class="icon" src="../assets/images/search.svg" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { open } from "@tauri-apps/plugin-shell";
import { getImageByPath } from "@/utils/getImages";

const searchData = ref("");
const showDropdown = ref(false);
/** 搜索引擎列表 */
const searchEngines = [
  {
    title: "baidu",
    logo: "../assets/images/engine/baidu.png",
    url: "https://www.baidu.com/s?wd=",
    handleSearch: (data) => {
      open(`https://www.baidu.com/s?wd=${data}`);
    },
  },
  {
    title: "bing",
    logo: "../assets/images/engine/bing.png",
    url: "https://bing.com/search?q=",
    handleSearch: (data) => {
      open(`https://bing.com/search?q=${data}`);
    },
  },
  {
    title: "google",
    logo: "../assets/images/engine/google.png",
    url: "https://www.google.com/search?q=",
    handleSearch: (data) => {
      open(`https://www.google.com/search?q=${data}`);
    },
  },
  {
    title: "yahoo",
    logo: "../assets/images/engine/yahoo.png",
    url: "https://search.yahoo.com/search?p=",
    handleSearch: (data) => {
      open(`https://search.yahoo.com/search?p=${data}`);
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
    position: relative;

    .search-input {
      width: 135px;
      height: 25px;
      border-radius: 18px;
      outline: none;
      border: 1px solid #ccc;
      padding-left: 20px;
      padding-right: 40px;
      white-space: nowrap;
      overflow: hidden;
      font-size: 16px;
    }

    .search-btn {
      position: absolute;
      top: 5px;
      right: 10px;
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
