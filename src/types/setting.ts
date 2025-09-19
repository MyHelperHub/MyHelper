/** 设置总体配置 */
export type SettingConfig = {
  /** 开机启动 */
  autoStart: boolean;
  /** 剪贴板监听 */
  clipboardListening: boolean;
  /** 全局快捷键 */
  hotkey: HotkeyConfig;
};

/** 全局快捷键 */
export type HotkeyConfig = {
  /** 全局快捷键是否启用 */
  enabled: boolean;
  /** 打开/关闭主窗口 */
  togglePanel: HotkeyItem;
  /** 打开/关闭常用软件弹窗 */
  toggleAppList: HotkeyItem;
  /** 打开/关闭常用网站弹窗 */
  toggleWebList: HotkeyItem;
  /** 打开/关闭常用快捷输入弹窗 */
  toggleQuickInput: HotkeyItem;
};

/** 快捷键字段 */
export type HotkeyItem = {
  enabled: boolean;
  [key: string]: any;
};
