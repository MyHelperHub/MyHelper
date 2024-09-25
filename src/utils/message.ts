// src/utils/message.ts
import { ref } from 'vue';

// 定义消息引用的类型
interface MessageRef {
    showMessage: (message: string, duration?: number) => void;
}

const messageRef = ref<MessageRef | null>(null);

const setMessageRef = (ref: MessageRef | null) => {
    messageRef.value = ref;
};

/** 展示消息
 * @param {string} message - 消息内容
 * @param {number} duration - 消息展示时间
 */
const showMessage = (message: string, duration?: number) => {
    if (messageRef.value) {
        messageRef.value.showMessage(message, duration);
    }
};

export { setMessageRef, showMessage };
