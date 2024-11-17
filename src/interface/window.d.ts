import { NewWindowEnum } from "./windowEnum";

/**
 * 窗口配置接口
 * @param windowId 窗口类型枚举
 * @param title 窗口标题
 * @param url 窗口加载的路径
 * @param size 窗口大小，数组包含宽度和高度
 * @param position 窗口位置，数组包含x和y坐标
 * @param alwaysOnTop 是否置顶
 * @param resizable 是否可调整大小
 * @param icon 窗口图标路径
 * @param loading 是否显示加载状态
 */
export interface WindowConfig {
  windowId: NewWindowEnum;
  title: string;
  url: string;
  size: [number, number];
  position?: [number, number];
  alwaysOnTop?: boolean;
  resizable?: boolean;
  icon?: string;
  loading?: boolean;
}
