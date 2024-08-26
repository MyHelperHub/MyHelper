use tauri::{ WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn open_new_window(app_handle: tauri::AppHandle) {
    let new_window = WebviewWindowBuilder::new(
        &app_handle,
        "new_window", // 新窗口的唯一标识符
        WebviewUrl::App("/#/settings".into()), // 新窗口加载的内容
    )
    .title("新窗口")
    .decorations(false)
    .inner_size(400.0, 300.0) // 设置窗口大小
    .build()
    .unwrap();
    new_window.show().unwrap(); // 显示窗口
}
