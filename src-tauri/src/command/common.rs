use std::path::Path;

use reqwest;
use tauri::image::Image;
use tauri::{LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder};

// 定义参考分辨率（比如以2560x1440为基准）
const REFERENCE_WIDTH: f64 = 2560.0;
const REFERENCE_HEIGHT: f64 = 1440.0;
const SMALL_SCREEN_SCALE_FACTOR: f64 = 1.3;

// 设置窗口大小的函数也需要相应修改
#[tauri::command]
pub async fn set_window_size(
    app_handle: tauri::AppHandle,
    width: f64,  // 基于参考分辨率的宽度
    height: f64, // 基于参考分辨率的高度
) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let monitor = window
            .current_monitor()
            .map_err(|e| e.to_string())?
            .ok_or("未找到监视器".to_string())?;
        let monitor_size = monitor.size();

        // 计算缩放比例
        let scale_width = monitor_size.width as f64 / REFERENCE_WIDTH;
        let scale_height = monitor_size.height as f64 / REFERENCE_HEIGHT;
        let scale_factor = scale_width.min(scale_height);

        // 当实际分辨率小于等于参考分辨率时，将缩放因子稍微调大
        let adjusted_scale_factor = if monitor_size.width as f64 <= REFERENCE_WIDTH
            && monitor_size.height as f64 <= REFERENCE_HEIGHT
        {
            scale_factor * SMALL_SCREEN_SCALE_FACTOR
        } else {
            scale_factor
        };

        // 应用缩放
        let scaled_width = width * adjusted_scale_factor;
        let scaled_height = height * adjusted_scale_factor;

        window
            .set_size(tauri::Size::Logical(LogicalSize {
                width: scaled_width,
                height: scaled_height,
            }))
            .map_err(|e| e.to_string())?;

        // 设置网页内容的缩放比例
        window
            .set_zoom(adjusted_scale_factor)
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
    always_on_top: Option<bool>,
    resizable: Option<bool>,
    icon: Option<String>,
) -> Result<(), String> {
    // 获取主监视器信息并计算缩放比例
    let monitor = app_handle
        .primary_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("未找到主监视器".to_string())?;
    let monitor_size = monitor.size();
    let scale_factor = if monitor_size.width as f64 <= REFERENCE_WIDTH
        && monitor_size.height as f64 <= REFERENCE_HEIGHT
    {
        (monitor_size.width as f64 / (REFERENCE_WIDTH * SMALL_SCREEN_SCALE_FACTOR))
            .min(monitor_size.height as f64 / (REFERENCE_HEIGHT * SMALL_SCREEN_SCALE_FACTOR))
    } else {
        (monitor_size.width as f64 / REFERENCE_WIDTH)
            .min(monitor_size.height as f64 / REFERENCE_HEIGHT)
    };

    // 当实际分辨率小于等于参考分辨率时，将缩放因子稍微调大
    let adjusted_scale_factor = if monitor_size.width as f64 <= REFERENCE_WIDTH
        && monitor_size.height as f64 <= REFERENCE_HEIGHT
    {
        scale_factor * SMALL_SCREEN_SCALE_FACTOR
    } else {
        scale_factor
    };

    // 计算窗口大小和位置
    let (base_width, base_height) = size.unwrap_or((600.0, 400.0));
    let (width, height) = (
        base_width * adjusted_scale_factor,
        base_height * adjusted_scale_factor,
    );
    let (x, y) = if let Some(pos) = position {
        (pos.0 * adjusted_scale_factor, pos.1 * adjusted_scale_factor)
    } else {
        (
            (monitor_size.width as f64 - width) / 2.0,
            (monitor_size.height as f64 - height) / 2.0,
        )
    };

    // 构建基础窗口配置
    let mut builder =
        WebviewWindowBuilder::new(&app_handle, &window_id, WebviewUrl::App(url.into()))
            .title(title)
            .shadow(false)
            .transparent(true)
            .visible(false)
            .decorations(false)
            .always_on_top(always_on_top.unwrap_or(false))
            .resizable(resizable.unwrap_or(true))
            .inner_size(width, height)
            .position(x, y);

    // 处理图标设置
    if let Some(icon_path) = icon {
        if !icon_path.starts_with("http") {
            if Path::new(&icon_path).exists() {
                if let Ok(icon_bytes) = std::fs::read(&icon_path) {
                    if let Ok(icon) = Image::from_bytes(&icon_bytes) {
                        builder = builder.icon(icon).map_err(|e| e.to_string())?;
                    }
                }
            }
        } else {
            let window_id_clone = window_id.clone();
            let app_handle_clone = app_handle.clone();
            let icon_path_clone = icon_path.clone();

            tauri::async_runtime::spawn(async move {
                if let Ok(response) = reqwest::get(&icon_path_clone).await {
                    if let Ok(bytes) = response.bytes().await {
                        if let Ok(icon) = Image::from_bytes(&bytes.to_vec()) {
                            if let Some(window) =
                                app_handle_clone.get_webview_window(&window_id_clone)
                            {
                                let _ = window.set_icon(icon);
                            }
                        }
                    }
                }
            });
        }
    }

    // 创建并显示窗口
    let new_window = builder.build().map_err(|e| e.to_string())?;
    new_window
        .set_zoom(adjusted_scale_factor)
        .map_err(|e| e.to_string())?;
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
