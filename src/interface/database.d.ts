import { User } from "./user";
import { WebItem } from "./web";

export interface ConfigData {
  key: string;
  value: string;
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
    clipboardListening: boolean;
  };
  userConfig: User;
}
