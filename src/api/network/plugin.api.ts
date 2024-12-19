import { Plugin, PluginUpdateDTO } from '@/interface/plugin';
import { request } from './wrapper';

/**
 * 获取插件列表
 * @param params 查询参数
 * @param params.category 插件分类
 * @param params.status 插件状态
 * @param params.author 作者
 * @param params.userId 用户ID
 * @param params.pageIndex 页码
 * @param params.pageSize 每页数量
 * @returns 插件列表数据
 */
export const getPluginList = (params?: {
  category?: string;
  status?: string;
  author?: string;
  userId?: number;
  pageIndex:number;
  pageSize:number
}) => {
  return request.get<Plugin[]>('/api/plugin/list', { params });
};

/**
 * 获取插件详情
 */
export const getPluginDetail = (windowId: string) => {
  return request.get<Plugin>('/api/plugin/detail', {
    params: { windowId }
  });
};

/**
 * 创建插件
 */
export const createPlugin = (plugin: Plugin) => {
  return request.post<Plugin>('/api/plugin/create', plugin);
};

/**
 * 更新插件
 */
export const updatePlugin = (plugin: PluginUpdateDTO) => {
  return request.post('/api/plugin/update', plugin);
};

/**
 * 删除插件
 */
export const deletePlugin = (windowId: string) => {
  return request.post('/api/plugin/delete', null, {
    params: { windowId }
  });
};

/**
 * 下载插件
 */
export const downloadPlugin = (windowId: string) => {
  return request.post('/api/plugin/download', null, {
    params: { windowId }
  });
};

/**
 * 评分插件
 */
export const ratePlugin = (windowId: string, rating: number) => {
  return request.post('/api/plugin/rate', null, {
    params: { windowId, rating }
  });
};

/**
 * 更新插件状态
 */
export const updatePluginStatus = (
  windowId: string,
  status: string,
  message?: string
) => {
  return request.post('/api/plugin/status', null, {
    params: { windowId, status, message }
  });
};

/**
 * 上传插件文件
 */
export const uploadPluginFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<string>('/api/plugin/file/upload', formData);
};

/**
 * 下载插件文件
 */
export const downloadPluginFile = (fileName: string) => {
  return request.get('/api/plugin/file/download', {
    params: { fileName },
    responseType: 'blob'
  });
};

/**
 * 删除插件文件
 */
export const deletePluginFile = (fileName: string) => {
  return request.delete('/api/plugin/file', {
    params: { fileName }
  });
};

/**
 * 获取上传历史记录
 * @param params 查询参数
 * @param params.name 插件名称
 * @param params.status 状态
 * @param params.pageIndex 页码
 * @param params.pageSize 每页数量
 * @returns 上传历史记录数据
 */
export const getUploadHistory = (params?: {
  name?: string;
  status?: string;
  pageIndex?: number;
  pageSize?: number;
}) => {
  return request.get<Plugin[]>('/api/plugin/upload-history', { params });
};
 