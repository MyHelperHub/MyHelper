import { WindowConfig } from "./window";
import pluginConfig from "mh-plugin/mhPlugin.json";

/** 窗口类型枚举 */
export const NewWindowEnum = {
  Label: "label",
  My: "my",
  Setting: "setting",
  PluginMarket: "pluginMarket",
  MhPlugin: pluginConfig.windowId,
} as const;

/** 窗口类型枚举类型 */
export type NewWindowEnum = (typeof NewWindowEnum)[keyof typeof NewWindowEnum];

/** 窗口配置 */
export const WINDOW_CONFIG: Record<
  (typeof NewWindowEnum)[keyof typeof NewWindowEnum],
  WindowConfig
> = {
  [NewWindowEnum.Label]: {
    windowId: NewWindowEnum.Label,
    title: "桌面便签",
    url: "#/label",
    size: [210, 250],
  },
  [NewWindowEnum.My]: {
    windowId: NewWindowEnum.My,
    title: "我的",
    url: "#/my",
    size: [800, 600],
  },
  [NewWindowEnum.Setting]: {
    windowId: NewWindowEnum.Setting,
    title: "设置",
    url: "#/setting",
    size: [670, 520],
  },
  [NewWindowEnum.PluginMarket]: {
    windowId: NewWindowEnum.PluginMarket,
    title: "插件市场",
    url: "#/plugin-market",
    size: [1300, 700],
    loading: true,
  },
  [NewWindowEnum.MhPlugin]: {
    windowId: NewWindowEnum.MhPlugin,
    title: pluginConfig.title,
    url: `#/plugin/${pluginConfig.windowId}`,
    size: [670, 520],
  },
};
