export enum SettingMenuItemEnum {
  General = "general",
  About = "about",
}

export enum ResponseCodeEnum {
  SUCCESS = "0001",
  FAILED = "0002",
}

/**
 * 窗口操作类型
 * @enum {number}
 * @property {number} Close - 关闭窗口，值为0
 * @property {number} Minimize - 最小化窗口，值为1
 * @property {number} Maximize - 最大化窗口，值为2
 * @property {number} Restore - 还原窗口，值为3
 * @property {number} ToggleAlwaysOnTop - 切换窗口置顶状态，值为4
 */
export enum WindowOperation {
  Close = 0,
  Minimize = 1,
  Maximize = 2,
  Restore = 3,
  ToggleAlwaysOnTop = 4,
}
