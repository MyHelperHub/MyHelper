import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

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
  (config) => {
    // 这里可以添加token等通用处理
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("API请求失败:", error);
    return Promise.reject(error);
  },
);

// 封装请求方法
export const request = {
  get: <T>(url: string, config?: AxiosRequestConfig) => {
    return instance.get<any, T>(url, config);
  },

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    return instance.post<any, T>(url, data, config);
  },
};
