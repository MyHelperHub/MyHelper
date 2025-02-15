import {
  Plugin,
  PluginUpdateDTO,
  PluginCategory,
  PluginStatus,
  PluginSortType,
  PluginResponse,
} from "@/interface/plugin";
import { request } from "./wrapper";

/**
 * 获取插件列表
 * @param params 查询参数
 * @param params.category 插件分类
 * @param params.status 插件状态
 * @param params.author 作者
 * @param params.userId 用户ID
 * @param params.pageIndex 页码
 * @param params.pageSize 每页数量
 * @param params.sort 排序方式
 * @param params.timeFilter 时间筛选
 * @returns 插件列表数据
 */
export const getPluginList = (params?: {
  category?: PluginCategory;
  status?: PluginStatus;
  author?: string;
  userId?: number;
  pageIndex?: number;
  pageSize?: number;
  sort?: PluginSortType;
  timeFilter?: string;
}) => {
  return request.get<PluginResponse>("/api/plugin", { params });
};

/**
 * 获取插件详情
 */
export const getPluginDetail = (windowId: string) => {
  return request.get<Plugin>(`/api/plugin/${windowId}`);
};

/**
 * 创建插件
 */
export const createPlugin = (plugin: Plugin) => {
  return request.post<Plugin>("/api/plugin", plugin);
};

/**
 * 更新插件
 */
export const updatePlugin = (windowId: string, plugin: PluginUpdateDTO) => {
  return request.put(`/api/plugin/${windowId}`, plugin);
};

/**
 * 删除插件
 */
export const deletePlugin = (windowId: string) => {
  return request.delete(`/api/plugin/${windowId}`);
};

/**
 * 下载插件
 */
export const downloadPlugin = (windowId: string) => {
  return request.post(`/api/plugin/${windowId}/download`);
};

/**
 * 评分插件
 */
export const ratePlugin = (windowId: string, rating: number) => {
  return request.post(`/api/plugin/${windowId}/rate`, null, {
    params: { rating },
  });
};

/**
 * 更新插件状态
 */
export const updatePluginStatus = (
  windowId: string,
  status: string,
  message?: string,
) => {
  return request.put(`/api/plugin/${windowId}/status`, null, {
    params: { status, message },
  });
};

/**
 * 上传图片
 * @param file 图片文件(仅支持 jpg/jpeg/png/gif/webp,最大5MB)
 * @param type 图片类型(avatar:头像, screenshot:截图, other:其他)
 * @returns 返回上传后的图片URL
 */
export const uploadImage = (
  file: File,
  type: "avatar" | "screenshot" | "other" = "other",
) => {
  // 验证文件类型
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("仅支持 jpg/jpeg/png/gif/webp 格式的图片");
  }

  // 验证文件大小（5MB = 5 * 1024 * 1024 bytes）
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("图片大小不能超过5MB");
  }

  const formData = new FormData();
  formData.append("file", file);

  return request.post<string>("/api/plugin/file/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: {
      type,
    },
  });
};

/**
 * 上传插件文件
 * @param file 插件文件(仅支持 zip/rar/7z,最大15MB)
 * @returns 返回上传后的文件名
 */
export const uploadPluginFile = (file: File) => {
  // 验证文件类型
  const allowedTypes = [
    "application/x-zip-compressed",
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
  ];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("仅支持 zip/rar/7z 格式的文件");
  }

  // 验证文件大小（15MB = 15 * 1024 * 1024 bytes）
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("文件大小不能超过15MB");
  }

  const formData = new FormData();
  formData.append("file", file);

  return request.post<string>("/api/plugin/file/plugin", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * 下载插件文件
 */
export const downloadPluginFile = (fileName: string) => {
  return request.get("/api/plugin/file/plugin", {
    params: { fileName },
    responseType: "blob",
  });
};

/**
 * 删除插件文件
 */
export const deletePluginFile = (fileName: string) => {
  return request.delete("/api/plugin/file/plugin", {
    params: { fileName },
  });
};

/**
 * 删除图片
 */
export const deleteImage = (imageUrl: string) => {
  return request.delete("/api/plugin/file/image", {
    params: { imageUrl },
  });
};

/**
 * 获取上传历史记录
 * @param params 查询参数
 * @param params.name 插件名称
 * @param params.status 状态
 * @param params.pageIndex 页码
 * @param params.pageSize 每页数量
 * @param params.sort 排序方式
 * @returns 上传历史记录数据
 */
export const getUploadHistory = (params?: {
  name?: string;
  status?: string;
  pageIndex?: number;
  pageSize?: number;
  sort?: PluginSortType;
}) => {
  return request.get<Plugin[]>("/api/plugin/history", { params });
};

/**
 * 获取开发者插件列表
 * @param params 查询参数
 * @param params.name 插件名称
 * @param params.status 状态
 * @param params.pageIndex 页码
 * @param params.pageSize 每页数量
 * @param params.sort 排序方式
 * @returns 开发者插件列表数据
 */
export const getDeveloperPlugins = (params?: {
  name?: string;
  status?: string;
  pageIndex?: number;
  pageSize?: number;
  sort?: PluginSortType;
}) => {
  return request.get<Plugin[]>("/api/plugin/developer", { params });
};
