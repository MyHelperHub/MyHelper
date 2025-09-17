import { User } from "./user";
import { WebItem } from "./web";

export type ConfigData = {
  key: string;
  value: string;
}
/** 快捷键字段 */
export type HotkeyConfig = {
  enabled: boolean;
  [key: string]: any;
}

export type AppConfig = {
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
    autoStart: boolean;
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
