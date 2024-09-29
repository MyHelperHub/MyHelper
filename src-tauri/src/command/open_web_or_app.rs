use open::that;

#[tauri::command]
pub fn open_web_or_app(path: String) -> Result<(), String> {
    that(&path).map_err(|_| "Failed to open file".to_string())
}
