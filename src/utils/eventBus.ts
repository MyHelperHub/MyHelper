// eventBus.ts
import { ref } from "vue";

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
  if (!eventBus.value.has(event)) {
    eventBus.value.set(event, []);
  }
  eventBus.value.get(event)?.push(callback);
}

/**
 * 更新某个事件的监听器。
 * @param event - 事件名称。
 * @param callback - 需要更新的回调函数。
 */
export function update(event: string, callback: Function) {
  const listeners = eventBus.value.get(event);
  if (listeners) {
    eventBus.value.set(
      event,
      listeners.filter((listener) => listener !== callback),
    );
  }
}

/**
 * 移除某个事件的所有监听器。
 * @param event - 事件名称。
 */
export function off(event: string) {
  eventBus.value.delete(event);
}

/**
 * 触发某个事件，并向监听该事件的回调函数传递数据。
 * @param event - 事件名称。
 * @param payload - 可选参数，传递给监听器的事件数据。
 */
export function emit(event: string, payload?: any) {
  const listeners = eventBus.value.get(event);
  if (listeners) {
    listeners.forEach((listener) => listener(payload));
  }
}

/**
 * 移除所有事件的监听器（可选扩展功能）。
 * @param event - 可选参数，如果传递则清除特定事件的监听器，否则清除所有事件监听器。
 */
export function clear(event?: string) {
  if (event) {
    eventBus.value.delete(event);
  } else {
    eventBus.value.clear();
  }
}
