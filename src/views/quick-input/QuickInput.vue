<template>
    <div class="quick-input">
        <CloseOutline class="close" @click="closeAllMenu" />
        <n-tabs v-model:value="activeTab" type="line" size="medium" justify-content="space-evenly" animated>
            <n-tab-pane name="0" tab="常用">
                <CommonText />
            </n-tab-pane>
            <n-tab-pane name="1" tab="剪切板">
                <Clipboard />
            </n-tab-pane>
        </n-tabs>
    </div>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";
import CommonText from "./CommonText.vue";
import Clipboard from "./Clipboard.vue";
import { CloseOutline } from "@vicons/ionicons5";
import { NTabs, NTabPane } from 'naive-ui';

const closeAllMenu = inject<() => void>("closeAllMenu") || (() => { });

/** 0为常用，1为剪切板 */
const activeTab = ref('0'); // 注意：Naive UI 的 v-model 需要绑定字符串类型
</script>

<style lang="less">
.quick-input {
    position: absolute;
    top: -185px;
    left: -13px;
    background-color: rgb(242, 244, 253);
    width: 210px;
    height: 330px;
    border-radius: 10px;
    z-index: 2;
    cursor: default;
}

.close {
    position: absolute;
    right: 0;
    height: 25px;
    cursor: pointer;
    z-index: 1;
}

.n-tabs {
    .n-tabs--top {
        .n-tab-pane {
            padding: 0;
        }
    }
}
</style>