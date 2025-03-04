use crate::utils::hotkey::HotkeyManager;


#[tauri::command]
pub fn set_hotkey_enabled(enabled: bool) -> bool {
    HotkeyManager::global().set_enabled(enabled)
}