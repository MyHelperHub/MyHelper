<template>
    <div class="message-container">
        <transition name="fade">
            <div v-if="visible" class="message" @click="hideMessage">
                {{ message }}
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref<string>('');
const duration = ref<number>(3000);
const visible = ref(false);
let timer: ReturnType<typeof setTimeout>; // 用于存储定时器 ID

const hideMessage = () => {
    visible.value = false;
};

const showMessage = (msg: string, dur?: number) => {
    message.value = msg;
    if (dur) {
        duration.value = dur;
    }
    visible.value = true;

    // 清除上一个定时器
    if (timer) {
        clearTimeout(timer);
    }

    // 设置新的定时器
    timer = setTimeout(hideMessage, duration.value);
};

defineExpose({ showMessage });
</script>

<style lang="less" scoped>
.message-container {
    .message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 9999;
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}
</style>