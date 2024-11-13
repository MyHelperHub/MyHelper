import { WindowConfig } from "./window";

export enum NewWindowEnum {
  Label = "label",
  My = "my", 
  Setting = "setting",
  PluginMarket = "pluginMarket",
  Plugin = "plugin", 
}

// 获取窗口配置
export function getWindowConfig(windowId: string): WindowConfig {
  // 如果是动态插件窗口 (如 plugin-1, plugin-2)
  if (windowId.startsWith(NewWindowEnum.Plugin + '-')) {
    return {
      windowId: windowId as NewWindowEnum,
      title: "插件",  // 或者可以从参数中获取具体插件名称
      url: `#/plugin/${windowId}`,  // 动态路由
      size: [670, 520],
      resizable: true,
      alwaysOnTop: false
    };
  }
  
  // 其他固定窗口配置
  return WINDOW_CONFIG[windowId as NewWindowEnum];
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
  },
  [NewWindowEnum.Plugin]: {
    windowId: NewWindowEnum.Plugin,
    title: "插件",
    url: "#/plugin",
    size: [670, 520],
    resizable: true,
    alwaysOnTop: false
  }
};
