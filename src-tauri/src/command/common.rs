use std::path::Path;

use tauri::{LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder};

/** 设置窗口大小的命令 */
#[tauri::command]
pub async fn set_window_size(
    app_handle: tauri::AppHandle,
    width: f64,
    height: f64,
) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window
            .set_size(tauri::Size::Logical(LogicalSize { width, height }))
            .map_err(|e| e.to_string())?;
    } else {
        return Err("未找到 main 窗口".to_string());
    }
    Ok(())
}

/** 封装创建新窗口的异步函数 */
#[tauri::command]
pub async fn create_new_window(
    app_handle: tauri::AppHandle,
    window_id: String,
    title: String,
    url: String,
    size: Option<(f64, f64)>,
    position: Option<(f64, f64)>,
) -> Result<(), String> {
    // 克隆 app_handle
    let app_handle_clone = app_handle.clone();

    let mut builder =
        WebviewWindowBuilder::new(&app_handle_clone, &window_id, WebviewUrl::App(url.into()))
            .title(title)
            .shadow(false)
            .transparent(true)
            .visible(false)
            .decorations(false);

    // 设置窗口大小
    let (width, height) = match size {
        Some((w, h)) => (w, h),
        None => (400.0, 300.0), // 默认大小
    };
    builder = builder.inner_size(width, height);

    // 获取主屏幕的大小和缩放比例
    let primary_monitor = app_handle.primary_monitor().map_err(|e| e.to_string())?;
    let monitor = primary_monitor.ok_or("未找到主监视器".to_string())?;
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    // 如果未指定位置，则计算窗口中心位置
    let (x, y) = if let Some(pos) = position {
        (pos.0 / scale_factor, pos.1 / scale_factor) // 调整位置
    } else {
        // 计算窗口的左上角位置，使窗口位于屏幕中央
        let center_x = (monitor_size.width as f64 / scale_factor - width) / 2.0;
        let center_y = (monitor_size.height as f64 / scale_factor - height) / 2.0;
        (center_x, center_y)
    };

    // 设置窗口位置
    builder = builder.position(x, y);
    // 创建并显示窗口
    let new_window = builder.build().map_err(|e| e.to_string())?;
    new_window.show().map_err(|e| e.to_string())?;

    Ok(())
}

/** 封装关闭窗口的异步函数 */
#[tauri::command]
pub async fn close_new_window(
    app_handle: tauri::AppHandle,
    window_id: String,
) -> Result<(), String> {
    // 通过 window_id 获取窗口实例
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        // 关闭窗口
        window.close().map_err(|e| e.to_string())?;
    } else {
        return Err(window_id);
    }
    Ok(())
}

/** 封装设置窗口置顶状态的异步函数 */
#[tauri::command]
pub async fn set_window_always_on_top(
    app_handle: tauri::AppHandle,
    window_id: String,
    is_always_on_top: bool,
) -> Result<(), String> {
    // 通过 window_id 获取窗口实例
    if let Some(window) = app_handle.get_webview_window(&window_id) {
        window
            .set_always_on_top(is_always_on_top)
            .map_err(|e| e.to_string())?;
    } else {
        return Err(window_id);
    }
    Ok(())
}

/**
 * 判断文件是否存在
 */
#[tauri::command]
pub fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}