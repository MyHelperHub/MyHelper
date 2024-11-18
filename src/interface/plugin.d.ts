import { WindowConfig } from "./window";

/**
 * 创建插件时的配置项
 * @extends WindowConfig
 * @param windowId 插件窗口ID，字符串类型，用于标识插件窗口
 * @param uuid 插件实例唯一ID，用于区分同一插件的不同实例
 * @param title 窗口标题
 * @param url 窗口加载的路径
 * @param size 窗口大小，数组包含宽度和高度 [width, height]
 * @param position 可选的窗口位置，数组包含x和y坐标 [x, y]
 * @param alwaysOnTop 可选的窗口是否置顶
 * @param resizable 可选的窗口是否可调整大小
 * @param icon 可选的插件图标路径
 * @param loading 可选的窗口是否显示加载动画，需自定义动画
 */
interface PluginConfig extends Omit<WindowConfig, "windowId"> {
  windowId: string;
  uuid: string;
}
