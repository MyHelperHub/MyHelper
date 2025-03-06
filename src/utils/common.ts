import { computed } from "vue";

/** 是否是开发环境 */
export const isDev = computed(() => import.meta.env.DEV);

/** 防抖函数 */
export const useDebounce = (callback: Function, delay: number) => {
  let timer: number | undefined;
  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

/** 延迟函数 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
