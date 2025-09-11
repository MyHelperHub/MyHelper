<template>
  <div class="message-container">
    <transition name="fade">
      <div
        v-if="visible"
        class="message"
        :class="messageClass"
        @click="hideMessage">
        {{ message }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const message = ref<string>("");
const duration = ref<number>(3000);
const visible = ref(false);
const type = ref<number>(0); // 0: 默认黑色, 1: 成功色绿色, 2: 警告色红色
let timer: ReturnType<typeof setTimeout> | null = null;

const messageClass = computed(() => {
  switch (type.value) {
    case 1:
      return "success";
    case 2:
      return "warning";
    default:
      return "";
  }
});

/**
 * 消息提示框
 * @param msg 提示信息
 * @param dur 持续时间
 * @param msgType 提示类型，0: 默认黑色, 1: 成功色绿色, 2: 警告色红色
 */
const showMessage = (msg: string, dur?: number, msgType?: number) => {
  message.value = msg;
  if (dur) {
    duration.value = dur;
  }
  if (msgType !== undefined) {
    type.value = msgType;
  }

  if (timer) {
    clearTimeout(timer);
  }
  visible.value = true;

  timer = setTimeout(() => {
    visible.value = false;
    timer = null;
  }, duration.value);
};

const hideMessage = () => {
  visible.value = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

defineExpose({ showMessage, hideMessage });
</script>

<style lang="less">
.message-container {
  .message {
    width: max-content;
    max-width: 80%;
    max-height: 30vh;
    overflow: auto;
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    z-index: 9999;
    transition: opacity 0.3s ease-in-out;
    font-size: 14px;
    letter-spacing: 1px;
    text-align: center;

    &.success {
      background-color: var(--p-green-500);
      opacity: 0.9;
    }

    &.warning {
      background-color: var(--p-red-500);
      opacity: 0.9;
    }
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
