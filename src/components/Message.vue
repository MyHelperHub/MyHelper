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
let timer: ReturnType<typeof setTimeout> | null = null;

const hideMessage = () => {
    visible.value = false;
};

const showMessage = (msg: string, dur?: number) => {
    message.value = msg;
    if (dur) {
        duration.value = dur;
    }

    // 如果上一个定时器存在并且还没有执行，则清除
    if (timer) {
        clearTimeout(timer);
    }

    // 立即显示消息
    visible.value = true;

    // 设置新的定时器
    timer = setTimeout(() => {
        hideMessage();
        timer = null; // 定时器执行完毕后，将其置空
    }, duration.value);
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
        border-radius: 20px;
        z-index: 9999;
        transition: opacity 0.3s ease-in-out;
        text-align: center;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }

    .fade-enter-to,
    .fade-leave-from {
        opacity: 1;
    }
}
</style>