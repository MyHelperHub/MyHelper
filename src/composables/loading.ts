import { ref } from "vue";

// 定义加载组件引用的类型
interface LoadingRef {
  showLoading: () => void;
  hideLoading: () => void;
}

const loadingRef = ref<LoadingRef | null>(null);

const setLoadingRef = (ref: LoadingRef | null) => {
  loadingRef.value = ref;
};

const showLoading = () => {
  if (loadingRef.value) {
    loadingRef.value.showLoading();
  }
};

const hideLoading = () => {
  if (loadingRef.value) {
    loadingRef.value.hideLoading();
  }
};

export { setLoadingRef, showLoading, hideLoading };
