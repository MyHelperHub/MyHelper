import { ref } from "vue";

/** 定义加载组件引用的类型 */
type LoadingRef = {
  showLoading: () => void;
  hideLoading: () => void;
}

/** 加载组件引用 */
const loadingRef = ref<LoadingRef | null>(null);

/** 设置加载组件引用 */
const setLoadingRef = (ref: LoadingRef | null) => {
  loadingRef.value = ref;
};

/** 显示加载状态 */
const showLoading = () => {
  if (loadingRef.value) {
    loadingRef.value.showLoading();
  }
};

/** 隐藏加载状态 */
const hideLoading = () => {
  if (loadingRef.value) {
    loadingRef.value.hideLoading();
  }
};

export { setLoadingRef, showLoading, hideLoading };
