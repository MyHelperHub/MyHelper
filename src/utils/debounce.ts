/** 防抖函数 */
export function useDebounce(callback: Function, delay: number) {
    let timer: number | undefined;
    return function (...args: any[]) {
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => {
            callback(...args);
        }, delay);
    };
}
