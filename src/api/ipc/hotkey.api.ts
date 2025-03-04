import { invoke } from "@tauri-apps/api/core";

/**
 * 设置热键启用状态
 */
export async function ipcSetHotkeyEnabled(enabled: boolean) {
    return await invoke<boolean>("set_hotkey_enabled", { enabled });
}
