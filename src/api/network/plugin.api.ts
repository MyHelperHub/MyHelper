import { Plugin, PluginUpdateDTO } from '@/interface/plugin';
import { request } from './wrapper';

/**
 * 获取插件列表
 */
export const getPluginList = (params?: {
  category?: string;
  status?: string;
  author?: string;
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