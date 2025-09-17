import { User } from "./user";
import { WebItem } from "./web";
import { AppItem } from "./common";
import { QuickInputConfig, SettingConfig } from "./setting";
import { ThemeConfig } from "./theme";
import {
  ModelConfig,
  ModelInfo,
  PetPreferences,
  PetSelectedModelConfig,
} from "./pet";
import { PluginConfig } from "./plugin";

/** 总表配置 */
type DatabaseConfig = {
  config: ConfigTableMap;
  pluginConfig: PluginConfigTableMap;
  petConfig: PetConfigTableMap;
}

/** config表 */
export type ConfigTableMap = {
  userConfig: User;
  appConfig: AppConfig;
  webConfig: WebConfig;
  quickInputConfig: QuickInputConfig;
  themeConfig: ThemeConfig;
  settingConfig: SettingConfig;
}

/** plugin_config表 */
export type PluginConfigTableMap = {
  [windowId: string]: PluginConfig;
}

/** pet_config表 */
export type PetConfigTableMap = {
  selected_model: PetSelectedModelConfig;
  preferences: PetPreferences;
}

/** 应用列表配置接口 */
export type AppConfig = {
  dataList: SelectItem[];
}

/** 网站配置接口 */
export type WebConfig = {
  dataList: SelectItem[];
}
