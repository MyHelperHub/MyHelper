/** 设置菜单项枚举 */
export enum SettingMenuItemEnum {
  General = "general",
  Theme = "theme",
  Pet = "pet",
  About = "about",
}

/** 响应码枚举 */
export enum ResponseCodeEnum {
  /** 成功   */
  SUCCESS = "0001",
  /** 失败 */
  FAILED = "0002",
  /** 未登录或token过期 */
  Unauthorized = "0003",
  /** 没有相关权限 */
  FORBIDDEN = "0004",
  /** 参数检验失败 */
  VALIDATE_FAILED = "0005",
  /** token已过期，请刷新token */
  TOKEN_EXPIRED = "0006",
}

/**
 * API状态码枚举（与Rust后端统一）
 */
export enum ApiStatusCode {
  /** 成功 */
  SUCCESS = 0,

  // 系统错误码 (1000-1099)
  ERR_SYSTEM = 1000,
  ERR_CONFIG = 1001,
  ERR_DATABASE = 1002,
  ERR_PERMISSION = 1003,

  // 参数错误码 (1100-1199)
  ERR_PARAMS = 1100,
  ERR_PARAMS_MISSING = 1101,
  ERR_PARAMS_INVALID = 1102,

  // 业务错误码 (1200-1299)
  ERR_USER_NOT_FOUND = 1200,
  ERR_USER_UNAUTHORIZED = 1201,

  // 文件错误码 (1300-1399)
  ERR_FILE_NOT_FOUND = 1300,
  ERR_FILE_READ = 1301,
  ERR_FILE_WRITE = 1302,

  // 网络错误码 (1400-1499)
  ERR_NETWORK = 1400,
  ERR_NETWORK_TIMEOUT = 1401,
  ERR_NETWORK_UNREACHABLE = 1402,
}

/** 窗口操作类型 */
export enum WindowOperation {
  /** 关闭窗口 */
  Close = 0,
  /** 最小化窗口 */
  Minimize = 1,
  /** 最大化窗口 */
  Maximize = 2,
  /** 还原窗口 */
  Restore = 3,
  /** 切换窗口置顶状态 */
  ToggleAlwaysOnTop = 4,
}

/** 显示模式枚举 */
export enum DisplayModeEnum {
  /** 列表视图 */
  List = 0,
  /** 卡片视图 */
  Card = 1,
}

/** 项目类型枚举 */
export enum ItemTypeEnum {
  /** 网站 */
  Web = 0,
  /** 应用程序 */
  App = 1,
}
