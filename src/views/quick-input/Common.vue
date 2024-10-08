<template>
    <div class="common">
        <div v-for="item in formData" :key="item.id" class="common-text">
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const formData = ref([
    { id: 0, title: "你好", text: "你好你好" },
    { id: 1, title: "按钮2", text: "按钮2文本" },
    { id: 2, title: "按钮3", text: "按钮3文本" },
    { id: 3, title: "按钮4", text: "按钮4文本" },
    { id: 4, title: "按钮5", text: "按钮5文本" },
]);
</script>

<style lang="less">
.common {
    display: flex;
    flex-direction: column;
    gap: 5px;
    /* 缩小块之间的间距 */
    margin: 5px 10px;
}

.common-text {
    background-color: #f2f4f5;
    border: 1px solid #dcdcdc;
    border-radius: 5px;
    padding: 8px;
    /* 缩小内边距 */
    transition: background-color 0.3s;
}

.common-text h3 {
    font-size: 14px;
    /* 缩小标题字体大小 */
    margin: 0;
    /* 去掉标题的外边距 */
}

.common-text p {
    font-size: 12px;
    /* 缩小文本字体大小 */
    margin: 0;
    /* 去掉文本的外边距 */
}

.common-text:hover {
    background-color: #e6e9ed;
}
</style>
