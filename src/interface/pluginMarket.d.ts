export enum MenuKey {
  MyPlugins = 0,
  UploadHistory = 1,
}

export interface PluginFormData {
  Name: string;
  Description: string;
  Version: string;
  Status: PluginStatus;
  Tags: string[];
  File: File | null;
  Icon: string;
  Screenshots: string[];
  WindowId: string;
  Title: string;
  Size: [number, number];
  Position: [number, number];
  AlwaysOnTop: boolean;
  Resizable: boolean;
  Category: PluginCategory;
}

export interface PluginFormErrors {
  Name: string;
  Version: string;
  Description: string;
  WindowId: string;
  Title: string;
  Size: string;
  Position: string;
}

export interface CategoryMenuItem {
  label: string;
  value: string | PluginCategory;
}

export interface SortOption {
  label: string;
  value: PluginSortType;
}

export interface TimeFilterOption {
  label: string;
  value: string;
}

export interface CategoryOption {
  label: string;
  value: PluginCategory;
}

export interface PluginMarketState {
  keyword: string;
  category: string;
  sort: PluginSortType;
  timeFilter: string;
  pageIndex: number;
  pageSize: number;
  total: number;
}

export interface LocalPluginFile {
  path: string;
  name: string;
  size: number;
}

export interface LocalPluginInfo {
  windowId: string;
  title: string;
  description: string;
  version?: string;
  author?: string;
  tags?: string[];
  category?: string;
  email?: string;
  size?: [number, number];
  position?: [number, number];
  alwaysOnTop?: boolean;
  resizable?: boolean;
  icon?: string;
}

export interface DeveloperPlugin {
  Id: number;
  Name: string;
  Description: string;
  Version: string;
  Status?: PluginStatus;
  Downloads?: number;
  CreateTime: string;
  UpdateTime: string;
  Author: string;
  Icon?: string;
  Tags?: string[];
  Rating?: number;
  Screenshots?: string[];
  WindowId?: string;
  Title?: string;
  Size?: [number, number];
  Position?: [number, number];
  AlwaysOnTop?: boolean;
  Resizable?: boolean;
  Message?: string;
  HasUpdate?: boolean;
  Category?: PluginCategory;
  Email?: string;
}

export interface PluginUploadData {
  Name: string;
  Description: string;
  Version: string;
  Tags: string[];
  Icon: string;
  Screenshots: string[];
  WindowId: string;
  Title: string;
  Size: [number, number];
  Position: [number, number];
  AlwaysOnTop: boolean;
  Resizable: boolean;
  FileUrl: string;
  Category: PluginCategory;
}

export interface PluginUpdateData extends PluginUploadData {
  Id: number;
}

export interface PluginAnalysisResult {
  success: boolean;
  message?: string;
  size?: number;
  pluginInfo: {
    windowId: string;
    name: string;
    description: string;
    version?: string;
    author?: string;
    email?: string;
    tags?: string[];
    category?: string;
    size?: [number, number];
    position?: [number, number];
    alwaysOnTop?: boolean;
    resizable?: boolean;
    icon?: string;
  };
}

export const STATUS_MAP: Record<number, string> = {
  0: "审核中",
  1: "已通过",
  2: "已驳回",
  3: "已停用",
};

export const STATUS_SEVERITY_MAP: Record<number, string> = {
  0: "warning",
  1: "success",
  2: "danger",
  3: "danger",
};

export const MENU_ITEMS = [
  { key: MenuKey.MyPlugins, label: "我的插件", icon: "pi pi-list" },
  { key: MenuKey.UploadHistory, label: "上传记录", icon: "pi pi-history" },
] as const;

export const MENU_TITLES = {
  [MenuKey.MyPlugins]: "我的插件",
  [MenuKey.UploadHistory]: "上传记录",
};

// Import missing types from other files
import { PluginStatus, PluginCategory, PluginSortType } from "./plugin.d";
