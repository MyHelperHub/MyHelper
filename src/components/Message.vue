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

/** 消息内容 */
const message = ref<string>("");
/** 显示持续时间 */
const duration = ref<number>(3000);
/** 是否可见 */
const visible = ref(false);
/** 消息类型
 * 0: 默认, 1: 成功(绿色), 2: 错误(红色) */
const type = ref<number>(0);
/** 定时器 */
let timer: ReturnType<typeof setTimeout> | null = null;

/** 计算消息样式类 */
const messageClass = computed(() => {
  switch (type.value) {
    case 1:
      return "success";
    case 2:
      return "error";
    default:
      return "";
  }
});

/**
 * 消息提示框
 * @param msg 提示信息
 * @param dur 持续时间
 * @param msgType 提示类型，0: 默认, 1: 成功(绿色), 2: 错误(红色)
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

/** 隐藏消息 */
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
    background-color: rgba(
      var(--theme-background-card-rgb),
      var(--theme-transparency-card)
    );
    color: var(--theme-text);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 10px 20px;
    border-radius: var(--theme-radius-xl);
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    box-shadow: var(--theme-shadow-sm);
    z-index: 9999;
    transition: opacity 0.3s ease-in-out;
    font-size: 14px;
    letter-spacing: 1px;
    text-align: center;

    &.success {
      background-color: rgba(
        var(--theme-success-rgb),
        var(--theme-transparency-card)
      );
      color: var(--theme-background);
    }

    &.error {
      background-color: rgba(
        var(--theme-error-rgb),
        var(--theme-transparency-card)
      );
      color: var(--theme-background);
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
