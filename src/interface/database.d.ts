import { User } from "./user";
import { WebItem } from "./web";

export interface ConfigData {
  key: string;
  value: string;
}
/** 快捷键字段 */
export interface HotkeyConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface AppConfig {
  appConfig: {
    dataList: any[];
  };
  quickInputConfig: {
    commonText: string[];
  };
  webConfig: {
    dataList: WebItem[];
  };
  settingConfig: {
    // 剪贴板监听
    clipboardListening: boolean;
    // 全局快捷键
    hotkey: {
      enabled: boolean;
      togglePanel: HotkeyConfig;
      toggleProxy: HotkeyConfig;
    };
  };
  userConfig: User;
}
