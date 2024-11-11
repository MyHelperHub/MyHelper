#[cfg(target_os = "windows")]
mod win;
#[cfg(target_os = "macos")]
mod mac;
#[cfg(target_os = "linux")]
mod linux;

#[tauri::command]
pub fn get_app_icon(exe_path: &str) -> Result<String, String> {
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
        linux::get_app_icon(exe_path)
    }
}