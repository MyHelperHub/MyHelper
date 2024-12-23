import { ServerResponse } from "@/interface/request";
import { showMessage } from "@/utils/message";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import GlobalData from "@/utils/globalData";

let cachedToken: string | null = null;

// 初始化token
const initToken = async () => {
  try {
    const userInfo = await GlobalData.get("userInfo");
    cachedToken = userInfo?.Token || null;
  } catch (error) {
    console.error("初始化token失败:", error);
    cachedToken = null;
  }
};

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  async (config) => {
    if (cachedToken) {
      config.headers["Token"] = cachedToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 初始化token
initToken();

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // 检查响应中的 Code
    if (response.data.Code === "0003") {
      showMessage("登录已过期，请重新登录", 3000, 2);
      // 清除本地缓存的 token
      updateToken(null);
      return Promise.reject(new Error(response.data.Message));
    }
    return response.data;
  },
  (error) => {
    // 检查是否为超时错误
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      showMessage("网络请求超时，请检查网络连接", 3000, 2);
    } else if (error.response?.status === 401) {
      // token 失效或未登录
      showMessage("登录已过期，请重新登录", 3000, 2);
      // 清除本地缓存的 token
      updateToken(null);
      // 跳转到登录页面
    } else {
      showMessage("网络请求失败", 3000, 2);
      console.error("API请求失败:", error);
    }
    return Promise.reject(error);
  },
);

// 封装请求方法
export const request = {
  get: <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ServerResponse<T>> => {
    return instance.get(url, config);
  },

  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ServerResponse<T>> => {
    return instance.post(url, data, config);
  },

  delete: <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ServerResponse<T>> => {
    return instance.delete(url, config);
  },
};

// 提供更新token的方法
export const updateToken = (token: string | null) => {
  cachedToken = token;
};
