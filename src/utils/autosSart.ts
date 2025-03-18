import { enable, isEnabled, disable } from "@tauri-apps/plugin-autostart";
import { updateConfig } from "./config";

export const setAutoStartEnabled = async (enabled: boolean) => {
  const isAutoEnabled = await isEnabled();
  // 检查传来的enabled与当前状态是否一致，如果不一致则修改config，保持与await isEnabled()一致
  if (enabled !== isAutoEnabled) {
    await updateConfig("settingConfig", { autoStart: isAutoEnabled });
  }

  if (enabled) {
    await enable();
  } else {
    await disable();
  }
};
