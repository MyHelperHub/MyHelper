import { getConfig } from "@/utils/config";
import { SettingConfig } from "@/types/setting";
import {
  normalizeHotkeyConfig,
  setHotkeyEnabled,
} from "@/composables/hotkey.ts";

let cachedSettingConfig: SettingConfig | null = null;

/** 设置的初始化默认值 */
const applyDefaults = (config?: SettingConfig | null): SettingConfig => ({
  autoStart: config?.autoStart ?? false,
  clipboardListening: config?.clipboardListening ?? false,
  hotkey: normalizeHotkeyConfig(config?.hotkey),
});

const updateCache = (config: SettingConfig): SettingConfig => {
  cachedSettingConfig = config;
  return cachedSettingConfig;
};

/** 同步缓存并返回归一化配置 */
export const primeSettingConfig = (
  config?: SettingConfig | null,
): SettingConfig => updateCache(applyDefaults(config));

/** 获取最新设置配置，必要时尝试数据库 */
export const loadSettingConfig = async (
  initial?: SettingConfig | null,
): Promise<SettingConfig> => {
  if (initial) {
    return primeSettingConfig(initial);
  }

  if (cachedSettingConfig) {
    return cachedSettingConfig;
  }

  const stored = await getConfig<SettingConfig>("settingConfig");
  return primeSettingConfig(stored);
};

/** 获取当前缓存的设置配置 */
export const getCachedSettingConfig = (): SettingConfig | null =>
  cachedSettingConfig;

/** 将归一化后的配置写入缓存 */
export const setCachedSettingConfig = (
  config: SettingConfig | null,
): SettingConfig => primeSettingConfig(config);

/** 切换热键启用状态并调用底层注册逻辑 */
export const setHotkeyEnabledState = async (
  enabled: boolean,
): Promise<void> => {
  const config = await loadSettingConfig();

  if (config.hotkey.enabled !== enabled) {
    config.hotkey.enabled = enabled;
    updateCache(config);
  }

  await setHotkeyEnabled(config.hotkey);
};
