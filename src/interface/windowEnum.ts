import { WindowConfig } from "./window";

export enum NewWindowEnum {
  Label = "label",
  My = "my",
  Setting = "setting",
  PluginMarket = "pluginMarket",
  Plugin = "plugin",
}

export const WINDOW_CONFIG: Record<NewWindowEnum, WindowConfig> = {
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
    size: [600, 400],
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
  [NewWindowEnum.Plugin]: {
    windowId: NewWindowEnum.Plugin,
    title: "插件",
    url: "#/plugin",
    size: [670, 520],
    resizable: true,
    alwaysOnTop: false,
  },
};
