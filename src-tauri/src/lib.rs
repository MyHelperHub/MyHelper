use tauri::{LogicalSize, Manager};

#[tauri::command]
fn set_window_size(app_handle: tauri::AppHandle, width: f64, height: f64) {
    if let Some(window) = app_handle.get_webview_window("main") {
        window
            .set_size(tauri::Size::Logical(LogicalSize { width, height }))
            .unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window
                .set_size(tauri::Size::Logical(LogicalSize {
                    width: 200.0,
                    height: 200.0,
                }))
                .unwrap();
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![set_window_size])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
