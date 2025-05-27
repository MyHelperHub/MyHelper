import { ServerResponse } from "@/interface/request";
import { showMessage } from "@/utils/message";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ResponseCodeEnum } from "@/interface/enum";
import { tokenManager } from "@/utils/tokenManager";
import { refreshToken } from "./user.api";

let isRefreshing = false; // 是否正在刷新token
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = []; // 失败请求队列

// 处理队列中的请求
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// 刷新token
const refreshTokenRequest = async (): Promise<string> => {
  try {
    const currentToken = await tokenManager.getToken();
    if (!currentToken) {
      throw new Error("当前没有有效的token");
    }

    const response = await refreshToken();

    if (response.Code === ResponseCodeEnum.SUCCESS) {
      const newToken = tokenManager.extractTokenFromResponse(response);
      if (newToken) {
        await tokenManager.setToken(newToken);
        return newToken;
      }
    }

    throw new Error(response.Message || "刷新token失败");
  } catch (error) {
    throw error;
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
    const token = await tokenManager.getToken();
    if (token) {
      const headerName = tokenManager.getHeaderName();
      config.headers[headerName] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 处理token刷新的统一函数
const handleTokenRefresh = async (response: AxiosResponse) => {
  const originalRequest = response.config as any;

  if (originalRequest._retry) {
    return Promise.reject(new Error("Token refresh failed"));
  }

  if (isRefreshing) {
    // 如果正在刷新token，将请求加入队列
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then((token) => {
      originalRequest.headers[tokenManager.getHeaderName()] = token;
      return instance(originalRequest);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const newToken = await refreshTokenRequest();
    processQueue(null, newToken);

    // 更新原始请求的token
    originalRequest.headers[tokenManager.getHeaderName()] = newToken;

    return instance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    // 刷新失败，清除token并提示用户重新登录
    await tokenManager.clearToken();
    showMessage("登录已过期，请重新登录", 3000, 2);
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};

// 响应拦截器
instance.interceptors.response.use(
  async (response) => {
    const { Code, Message } = response.data;

    // 检查未登录错误
    if (Code === ResponseCodeEnum.Unauthorized) {
      showMessage("暂未登录或登录已过期", 3000, 2);
      await tokenManager.clearToken();
      return Promise.reject(new Error(Message));
    }

    // 检查token过期，直接处理刷新逻辑
    if (Code === ResponseCodeEnum.TOKEN_EXPIRED) {
      return handleTokenRefresh(response);
    }

    return response.data;
  },
  async (error) => {
    const errorCode = error.response?.data?.Code;

    // 检查是否为token过期错误（HTTP错误状态码的情况）
    if (errorCode === ResponseCodeEnum.TOKEN_EXPIRED) {
      return handleTokenRefresh(error.response);
    }

    // 其他错误处理
    if (errorCode === ResponseCodeEnum.Unauthorized) {
      await tokenManager.clearToken();
      showMessage("暂未登录或登录已过期", 3000, 2);
    } else if (error.response?.status === 401) {
      await tokenManager.clearToken();
      showMessage("暂未登录或登录已过期", 3000, 2);
    } else if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout")
    ) {
      showMessage("网络请求超时，请检查网络连接", 3000, 2);
    } else {
      showMessage("网络请求失败", 3000, 2);
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

  put: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ServerResponse<T>> => {
    return instance.put(url, data, config);
  },

  delete: <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ServerResponse<T>> => {
    return instance.delete(url, config);
  },
};

// 兼容性方法，保持向后兼容
export const updateToken = async (token: string | null) => {
  if (token) {
    await tokenManager.setToken(token);
  } else {
    await tokenManager.clearToken();
  }
};

// 获取当前token
export const getToken = async () => {
  return await tokenManager.getToken();
};

// 检查token是否存在
export const hasToken = async () => {
  return await tokenManager.hasToken();
};
