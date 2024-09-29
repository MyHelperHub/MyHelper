// eventBus.ts
import { ref } from 'vue';

/**
 * eventBus 是一个 Map 类型的事件总线。
 * 键是事件名称，值是监听该事件的回调函数数组。
 */
const eventBus = ref(new Map<string, Function[]>());

/**
 * 监听某个事件。
 * @param event - 事件名称，作为事件的标识符。
 * @param callback - 当该事件被触发时调用的回调函数。
 */
export function on(event: string, callback: Function) {
  // 如果该事件名称不存在于事件总线中，先初始化为一个空数组
  if (!eventBus.value.has(event)) {
    eventBus.value.set(event, []);
  }
  // 将回调函数添加到该事件的回调函数数组中
  eventBus.value.get(event)?.push(callback);
}

/**
 * 移除某个事件的监听器。
 * @param event - 事件名称。
 * @param callback - 需要移除的回调函数。
 */
export function off(event: string, callback: Function) {
  const listeners = eventBus.value.get(event);
  if (listeners) {
    // 过滤掉与传入的 callback 不同的监听器，从而移除目标回调
    eventBus.value.set(event, listeners.filter((listener) => listener !== callback));
  }
}

/**
 * 触发某个事件，并向监听该事件的回调函数传递数据。
 * @param event - 事件名称。
 * @param payload - 可选参数，传递给监听器的事件数据。
 */
export function emit(event: string, payload?: any) {
  const listeners = eventBus.value.get(event);
  if (listeners) {
    // 遍历所有该事件的监听器，并依次执行回调函数
    listeners.forEach((listener) => listener(payload));
  }
}

/**
 * 移除所有事件的监听器（可选扩展功能）。
 * @param event - 可选参数，如果传递则清除特定事件的监听器，否则清除所有事件监听器。
 */
export function clear(event?: string) {
  if (event) {
    // 清除指定事件的监听器
    eventBus.value.delete(event);
  } else {
    // 清除所有事件和监听器
    eventBus.value.clear();
  }
}
