import { HotkeyConfig } from "./../../interface/database.d";
import { invoke } from "@tauri-apps/api/core";

/**
 * 设置热键启用状态
 */
export async function ipcSetHotkeyEnabled(config: HotkeyConfig) {
  return await invoke<boolean>("set_hotkey_enabled", { config });
}
