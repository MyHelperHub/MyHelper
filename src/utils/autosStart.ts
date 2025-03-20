import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { updateConfig, getConfig } from "./config";

/**
 * 同步检查系统开机启动状态并更新数据库
 * 返回系统实际的开机启动状态
 */
export const syncAutoStartState = async (
  autoStart: boolean,
): Promise<boolean> => {
  // 获取系统实际的开机启动状态
  const systemEnabled = await isEnabled();

  // 如果数据库状态与系统状态不一致，则更新数据库
  if (autoStart !== systemEnabled) {
    await updateConfig("settingConfig", { autoStart: systemEnabled });
  }

  return systemEnabled;
};

/**
 * 设置开机启动状态
 * @param enabled 是否启用开机启动
 */
export const setAutoStartEnabled = async (enabled: boolean) => {
  if (enabled) {
    await enable();
  } else {
    await disable();
  }

  // 操作完成后再次同步状态
  await syncAutoStartState(enabled);
};
