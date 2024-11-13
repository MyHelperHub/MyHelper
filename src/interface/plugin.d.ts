/**
 * 创建插件时的配置项
 * @param windowId 窗口ID
 * @param title 窗口标题
 * @param size 窗口大小 [宽, 高]
 * @param uuid 插件实例唯一ID
 * @param position 可选的窗口位置 [x, y]
 * @param alwaysOnTop 可选的窗口是否置顶
 * @param resizable 可选的窗口是否可调整大小
 * @param icon 可选的插件图标
 */
interface PluginConfig {
  windowId: string;
  title: string;
  size: [number, number];
  uuid: string;
  position?: [number, number];
  alwaysOnTop?: boolean;
  resizable?: boolean;
  icon?: string;
}
