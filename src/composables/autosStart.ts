import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { updateConfig } from "../utils/config.ts";

/**
 * 同步检查系统开机启动状态并更新数据库
 * 返回系统实际的开机启动状态
 */
export const syncAutoStartState = async (
  autoStart: boolean,
): Promise<boolean> => {
  const systemEnabled = await isEnabled();

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
