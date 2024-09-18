<template>
    <div class="search-container">
        <div class="search-list" @click="dropdown = !dropdown">
            <img class="search-img" :src="selectedEngine.src" :alt="selectedEngine.alt" />
            <transition name="slide-down">
                <div class="dropdown" v-if="dropdown">
                    <div class="dropdown-item" v-for="engine in searchEngines" :key="engine.alt"
                        @click="selectEngine(engine)">
                        <img :src="engine.src" :alt="engine.alt" />
                    </div>
                </div>
            </transition>
        </div>
        <div class="search-control">
            <input v-model="searchData" class="search-input" placeholder="搜索" @keydown.enter="handleSearch"
                spellcheck="false" />
            <div class="search-btn" @click="handleSearch">
                <svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M966.4 924.8l-230.4-227.2c60.8-67.2 96-156.8 96-256 0-217.6-176-390.4-390.4-390.4-217.6 0-390.4 176-390.4 390.4 0 217.6 176 390.4 390.4 390.4 99.2 0 188.8-35.2 256-96l230.4 227.2c9.6 9.6 28.8 9.6 38.4 0C979.2 950.4 979.2 934.4 966.4 924.8zM102.4 441.6c0-185.6 150.4-339.2 339.2-339.2s339.2 150.4 339.2 339.2c0 89.6-35.2 172.8-92.8 233.6-3.2 0-3.2 3.2-6.4 3.2-3.2 3.2-3.2 3.2-3.2 6.4-60.8 57.6-144 92.8-233.6 92.8C256 780.8 102.4 627.2 102.4 441.6z" />
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";

const dropdown = ref(false);
const searchData = ref("");
const searchEngines = [
    {
        src: new URL("@/assets/engine/baidu.png", import.meta.url).href,
        alt: "baidu",
        url: "https://www.baidu.com/s?wd=",
        handleSearch: (data) => {
            window.open(`https://www.baidu.com/s?wd=${data}`, "_blank");
        },
    },
    {
        src: new URL("@/assets/engine/bing.png", import.meta.url).href,
        alt: "bing",
        url: "https://bing.com/search?q=",
        handleSearch: (data) => {
            window.open(`https://bing.com/search?q=${data}`, "_blank");
        },
    },
    {
        src: new URL("@/assets/engine/google.png", import.meta.url).href,
        alt: "google",
        url: "https://www.google.com/search?q=",
        handleSearch: (data) => {
            window.open(`https://www.google.com/search?q=${data}`, "_blank");
        },
    },
    {
        src: new URL("@/assets/engine/yahoo.png", import.meta.url).href,
        alt: "yahoo",
        url: "https://search.yahoo.com/search?p=",
        handleSearch: (data) => {
            window.open(`https://search.yahoo.com/search?p=${data}`, "_blank");
        },
    },
];
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
        width: 35px;
        height: 35px;
        cursor: pointer;

        .search-img {
            width: 22px;
            height: 22px;
        }

        .dropdown {
            position: absolute;
            top: 100%; // 改为从顶部开始
            left: 0;
            width: auto; // 根据内容自动调整宽度
            background-color: #fff;
            border: 1px solid #ccc;
            z-index: 2;

            .dropdown-item {
                padding: 5px 10px;
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
                width: 100%;
                height: 100%;
            }
        }
    }
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease-in-out;
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}
</style>