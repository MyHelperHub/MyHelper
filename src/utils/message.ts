import { ref } from 'vue';

// 定义消息引用的类型
interface MessageRef {
    showMessage: (message: string, duration?: number, type?: number) => void;
    hideMessage: () => void; // 添加 hideMessage 方法
}

const messageRef = ref<MessageRef | null>(null);

const setMessageRef = (ref: MessageRef | null) => {
    messageRef.value = ref;
};

/** 展示消息
 * @param {string} message - 消息内容
 * @param {number} duration - 消息展示时间
 * @param {number} type - 消息类型：0 默认黑色，1 成功绿色，2 警告红色
 */
const showMessage = (message: string, duration?: number, type?: number) => {
    if (messageRef.value) {
        messageRef.value.showMessage(message, duration, type);
    }
};

/** 立即关闭消息 */
const hideMessage = () => {
    if (messageRef.value) {
        messageRef.value.hideMessage();
    }
};

export { setMessageRef, showMessage, hideMessage }; 