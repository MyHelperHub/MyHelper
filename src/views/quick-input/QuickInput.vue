<template>
    <div class="quick-input">
        <div class="tabs">
            <div class="tab" :class="{ active: activeTab === 'common' }" @click="activeTab = 'common'">
                常用
            </div>
            <div class="tab" :class="{ active: activeTab === 'clipboard' }" @click="activeTab = 'clipboard'">
                剪切板
            </div>
        </div>
        <div class="tab-content-wrapper">
            <transition name="fade">
                <div class="tab-content" v-if="activeTab === 'common'" key="common">
                    <Common />
                </div>
            </transition>
            <transition name="fade">
                <div class="tab-content" v-if="activeTab === 'clipboard'" key="clipboard">
                    <Clipboard />
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Common from './Common.vue';
import Clipboard from './Clipboard.vue';

const activeTab = ref('common'); // 默认选项卡为常用
</script>

<style lang="less">
.quick-input {
    position: absolute;
    left: -13px;
    background-color: rgb(242, 244, 253);
    width: 210px;
    min-height: 90px;
    height: fit-content;
    border-radius: 10px;
    z-index: 2;
    cursor: default;
}

.tabs {
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    margin: 0 20px;
    padding: 0 20px;
    border-bottom: 1px solid #ccc;
}

.tab {
    padding: 6px;
    cursor: pointer;
}

.tab.active {
    font-weight: bold;
    border-bottom: 2px solid #5295dd;
    /* 选中的 tab 下方边框 */
}

.tab-content-wrapper {
    position: relative;
    height: fit-content;
}

.tab-content {
    position: absolute;
    width: 100%;
    left: 0;
    top: 0;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}
</style>
