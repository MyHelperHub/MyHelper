import { WindowConfig } from "./window";

/**
 * 插件配置接口
 * @param windowId 插件窗口ID
 * @param data 窗口配置数据
 * @param info 插件信息
 */
export interface PluginConfig {
  windowId: string;
  data: WindowConfig;
  info: {
    installTime: string;
    status: PluginStatus;
    author: string;
    email: string;
    version: string;
    description: string;
    downloads: number;
    rating: number;
    tags: string[];
    category: PluginCategory;
    createTime: string;
    updateTime: string;
  };
}

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
  REVIEWING = 0, // 审核中
  PUBLISHED = 1, // 已发布
  REJECTED = 2, // 已驳回
  DISABLED = 3, // 已停用
}

/** 插件分类枚举 */
export enum PluginCategory {
  DEVELOPMENT = 0, // 开发工具
  EFFICIENCY = 1, // 效率工具
  NETWORK = 2, // 网络工具
  SYSTEM = 3, // 系统工具
  ENTERTAINMENT = 4, // 娱乐工具
  OTHER = 5, // 其他
}

/** 插件排序类型枚举 */
export enum PluginSortType {
  DOWNLOADS_ASC = 0, // 按下载量升序
  DOWNLOADS_DESC = 1, // 按下载量降序
  RATING_ASC = 2, // 按评分升序
  RATING_DESC = 3, // 按评分降序
  UPDATE_TIME_ASC = 4, // 按更新时间升序
  UPDATE_TIME_DESC = 5, // 按更新时间降序
  SMART = 6, // 智能排序
}

/** 插件信息接口 */
export interface Plugin {
  Id: number;
  Name: string;
  Description: string;
  Version: string;
  Author: string;
  Email: string;
  Downloads: number;
  Rating: number;
  Status: PluginStatus;
  Category: PluginCategory;
  Tags: string[];
  Screenshots: string[];
  WindowId: string;
  Title: string;
  Size: [number, number];
  Position: [number, number];
  AlwaysOnTop: boolean;
  Resizable: boolean;
  Icon: string;
  FileUrl: string;
  HasUpdate: boolean;
  Message: string | null;
  CreateTime: string;
  UpdateTime: string;
  installTime?: string;
}

/** 插件更新DTO */
export interface PluginUpdateDTO {
  WindowId: string;
  Name?: string;
  Description?: string;
  Version?: string;
  Icon?: string;
  Tags?: string[];
  Category?: PluginCategory;
  Title?: string;
  Size?: [number, number];
  Position?: [number, number];
  AlwaysOnTop?: boolean;
  Resizable?: boolean;
  Status?: PluginStatus;
  Screenshots?: string[];
}

export interface PluginThread {
  IsRated: boolean;
}

export interface PluginDetail {
  Plugin: Plugin;
  IsRated: boolean;
}

export interface PluginResponse {
  Message: string;
  Data: PluginDetail[];
  Code: string;
  Page: {
    PageIndex: number;
    PageSize: number;
    TotalRecords: number;
  };
}
