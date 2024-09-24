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

const showGlobalMessage = (message: string, duration?: number) => {
    if (messageRef.value) {
        messageRef.value.showMessage(message, duration);
    }
};

export { setMessageRef, showGlobalMessage };
