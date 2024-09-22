use base64::{engine::general_purpose, Engine};
use std::fs;
use std::io::Read;
use tauri::{LogicalSize, Manager};

#[tauri::command]
pub fn set_window_size(app_handle: tauri::AppHandle, width: f64, height: f64) {
    if let Some(window) = app_handle.get_webview_window("main") {
        window
            .set_size(tauri::Size::Logical(LogicalSize { width, height }))
            .unwrap();
    }
}

#[tauri::command]
pub fn get_image_base64(path: String) -> Result<String, String> {
    // 尝试打开指定路径的文件
    let mut file = fs::File::open(&path).map_err(|e| format!("Failed to open file: {}", e))?;

    // 读取文件数据
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // 将文件数据转换为 Base64 编码
    let base64_string = general_purpose::STANDARD.encode(&buffer);

    Ok(base64_string)
}
