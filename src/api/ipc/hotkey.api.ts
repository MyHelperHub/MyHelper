import { HotkeyConfig } from "../../types/setting";
import { invokeApi } from "./wrapper";

/**
 * 设置热键启用状态
 */
export async function ipcSetHotkeyEnabled(config: HotkeyConfig) {
  return await invokeApi<boolean>("set_hotkey_enabled", { config });
}
