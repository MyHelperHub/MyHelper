import { User } from "./user";
import { QuickInputItem, SelectItem } from "./common";
import { SettingConfig } from "./setting";
import { ThemeConfig } from "./theme";
import { PetPreferences, ModelConfig } from "./pet";
import { PluginConfig } from "./plugin";
import { DisplayModeEnum } from "./enum";

/** 总表配置 */
// @ts-expect-error
type DatabaseConfig = {
  /** 主配置 */
  config: ConfigTableMap;
  /** 插件 */
  pluginConfig: PluginConfigTableMap;
  /** 宠物 */
  petConfig: PetConfigTableMap;
};

/** config表 */
export type ConfigTableMap = {
  /** 用户 */
  userConfig: User;
  /** 应用 */
  appConfig: AppConfig;
  /** 网站 */
  webConfig: WebConfig;
  /** 快捷输入 */
  quickInputConfig: QuickInputConfig;
  /** 主题 */
  themeConfig: ThemeConfig;
  /** 设置 */
  settingConfig: SettingConfig;
};

/** plugin_config表 */
export type PluginConfigTableMap = {
  [windowId: string]: PluginConfig;
};

/** pet_config表 */
export type PetConfigTableMap = {
  /** 选中的模型 */
  selectedModel: ModelConfig;
  /** 偏好设置 */
  preferences: PetPreferences;
};

/** 应用列表配置 */
export type AppConfig = {
  dataList: SelectItem[];
  displayMode: DisplayModeEnum;
};

/** 网站配置 */
export type WebConfig = {
  dataList: SelectItem[];
  displayMode: DisplayModeEnum;
};

export type QuickInputConfig = QuickInputItem[];
