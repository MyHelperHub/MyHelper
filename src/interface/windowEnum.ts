export enum NewWindowEnum {
  Label = "label",
  My = "my",
  Setting = "setting",
  PluginMarket = "pluginMarket",
}

export interface WindowConfig {
  type: NewWindowEnum;
  title: string;
  path: string;
  size: [number, number];
}

export const WINDOW_CONFIG: Record<NewWindowEnum, WindowConfig> = {
  [NewWindowEnum.Label]: {
    type: NewWindowEnum.Label,
    title: "桌面便签",
    path: "#/label",
    size: [210, 250],
  },
  [NewWindowEnum.My]: {
    type: NewWindowEnum.My,
    title: "我的",
    path: "#/my",
    size: [600, 400],
  },
  [NewWindowEnum.Setting]: {
    type: NewWindowEnum.Setting,
    title: "设置",
    path: "#/setting",
    size: [670, 520],
  },
  [NewWindowEnum.PluginMarket]: {
    type: NewWindowEnum.PluginMarket,
    title: "插件市场",
    path: "#/plugin-market",
    size: [800, 600],
  },
};
