use tauri::{LogicalSize, Manager};

#[tauri::command]
pub fn set_window_size(app_handle: tauri::AppHandle, width: f64, height: f64) {
    if let Some(window) = app_handle.get_webview_window("main") {
        window
            .set_size(tauri::Size::Logical(LogicalSize { width, height }))
            .unwrap();
    }
}
