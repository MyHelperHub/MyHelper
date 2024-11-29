import { WindowConfig } from "./window";

/**
 * 创建插件时的配置项
 * @extends WindowConfig
 * @param windowId 插件窗口ID，字符串类型，用于标识插件窗口
 * @param title 窗口标题
 * @param size 窗口大小，数组包含宽度和高度 [width, height]
 * @param position 可选的窗口位置，数组包含x和y坐标 [x, y]
 * @param alwaysOnTop 可选的窗口是否置顶
 * @param resizable 可选的窗口是否可调整大小
 * @param icon 可选的插件图标路径
 * @param loading 可选的窗口是否显示加载动画，需自定义动画
 */
interface PluginConfig extends Omit<WindowConfig, "windowId" | "url"> {
  windowId: string;
}

/** 插件状态枚举 */
export enum PluginStatus {
  REVIEWING = 'REVIEWING',
  PUBLISHED = 'PUBLISHED', 
  REJECTED = 'REJECTED',
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED'
}

/** 插件分类枚举 */
export enum PluginCategory {
  DEVELOPMENT = 'DEVELOPMENT',
  EFFICIENCY = 'EFFICIENCY', 
  NETWORK = 'NETWORK',
  SYSTEM = 'SYSTEM',
  ENTERTAINMENT = 'ENTERTAINMENT',
  OTHER = 'OTHER'
}

/** 插件信息接口 */
export interface Plugin {
  id?: number;
  name: string;
  description: string;
  version: string;
  author?: string;
  email?: string;
  icon?: string;
  tags?: string[];
  rating?: number;
  downloads?: number;
  status?: string;
  category?: string;
  windowId?: string;
  title?: string;
  size?: [number, number];
  position?: [number, number];
  alwaysOnTop?: boolean;
  resizable?: boolean;
  screenshots?: string[];
  hasUpdate?: boolean;
  createTime?: string;
  updateTime?: string;
  message?: string;
}

/** 插件更新DTO */
export interface PluginUpdateDTO {
  windowId: string;
  name?: string;
  description?: string;
  version?: string;
  icon?: string;
  tags?: string[];
  category?: PluginCategory;
  title?: string;
  size?: [number, number];
  position?: [number, number];
  alwaysOnTop?: boolean;
  resizable?: boolean;
  status?: PluginStatus;
  screenshots?: string[];
}
