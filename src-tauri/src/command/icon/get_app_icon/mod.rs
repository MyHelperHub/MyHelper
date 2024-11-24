#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod mac;
#[cfg(target_os = "windows")]
mod win;

use crate::utils::error::AppResult;

#[tauri::command]
pub fn get_app_icon(exe_path: &str) -> AppResult<String> {
    #[cfg(target_os = "windows")]
    {
        win::get_app_icon(exe_path)
    }
    #[cfg(target_os = "macos")]
    {
        mac::get_app_icon(exe_path)
    }
    #[cfg(target_os = "linux")]
    {
        Ok(linux::get_app_icon(exe_path))
    }
}
