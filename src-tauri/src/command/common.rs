use crate::utils::error::{AppError, AppResult};
use std::path::Path;
use tauri::{LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder, image::Image};

/// 参考分辨率的宽度（2560x1440为基准）
const REFERENCE_WIDTH: f64 = 2560.0;
/// 参考分辨率的高度
const REFERENCE_HEIGHT: f64 = 1440.0;
/// 小屏幕额外缩放因子
const SMALL_SCREEN_SCALE_FACTOR: f64 = 1.3;

/// 设置窗口大小，会根据屏幕分辨率自动调整缩放
/// 
/// # Arguments
/// 
/// * `app_handle` - Tauri应用句柄
/// * `width` - 基于参考分辨率的目标宽度
/// * `height` - 基于参考分辨率的目标高度
#[tauri::command]
pub async fn set_window_size(
    app_handle: tauri::AppHandle,
    width: f64,
    height: f64,
) -> AppResult<()> {
    let window = app_handle
        .get_webview_window("main")
        .ok_or_else(|| AppError::WindowError("未找到 main 窗口".to_string()))?;

    let monitor = window
        .current_monitor()
        .map_err(|e| AppError::WindowError(e.to_string()))?
        .ok_or_else(|| AppError::WindowError("未找到监视器".to_string()))?;

    let monitor_size = monitor.size();

    // 计算缩放比例
    let scale_width = monitor_size.width as f64 / REFERENCE_WIDTH;
    let scale_height = monitor_size.height as f64 / REFERENCE_HEIGHT;
    let scale_factor = scale_width.min(scale_height);

    // 只在屏幕分辨率小于参考分辨率时才应用 SMALL_SCREEN_SCALE_FACTOR
    let adjusted_scale_factor = if (monitor_size.width as f64) < REFERENCE_WIDTH
        && (monitor_size.height as f64) < REFERENCE_HEIGHT
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
        .map_err(|e| AppError::WindowError(e.to_string()))?;

    // 设置网页内容的缩放比例
    window
        .set_zoom(adjusted_scale_factor)
        .map_err(|e| AppError::WindowError(e.to_string()))?;

    Ok(())
}

/// 创建新窗口
/// 
/// # Arguments
/// 
/// * `app_handle` - Tauri应用句柄
/// * `window_id` - 窗口唯一标识符
/// * `title` - 窗口标题
/// * `url` - 窗口加载的URL
/// * `size` - 窗口大小 (width, height)
/// * `position` - 窗口位置 (x, y)，-1 表示居中
/// * `always_on_top` - 是否总是置顶
/// * `resizable` - 是否可调整大小
/// * `icon` - 窗口图标路径
/// * `loading` - 是否显示加载状态
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
    loading: Option<bool>,
) -> AppResult<()> {
    let monitor = app_handle
        .primary_monitor()
        .map_err(|e| AppError::WindowError(e.to_string()))?
        .ok_or_else(|| AppError::WindowError("未找到主监视器".to_string()))?;

    let monitor_size = monitor.size();
    
    // 简化缩放计算逻辑
    let scale_factor = (monitor_size.width as f64 / REFERENCE_WIDTH)
        .min(monitor_size.height as f64 / REFERENCE_HEIGHT);

    // 只在屏幕分辨率小于参考分辨率时才应用 SMALL_SCREEN_SCALE_FACTOR
    let adjusted_scale_factor = if (monitor_size.width as f64) < REFERENCE_WIDTH
        && (monitor_size.height as f64) < REFERENCE_HEIGHT
    {
        scale_factor * SMALL_SCREEN_SCALE_FACTOR
    } else {
        scale_factor
    };

    // 计算窗口大小
    let (base_width, base_height) = size.unwrap_or((600.0, 400.0));
    let (width, height) = (
        base_width * adjusted_scale_factor,
        base_height * adjusted_scale_factor,
    );

    // 处理窗口位置，-1 表示居中
    let (x, y) = match position {
        Some((pos_x, pos_y)) => {
            let center_x = (monitor_size.width as f64 - width) / 2.0;
            let center_y = (monitor_size.height as f64 - height) / 2.0;
            
            match (pos_x, pos_y) {
                (-1.0, -1.0) => (center_x, center_y),                    // 完全居中
                (-1.0, y) => (center_x, y * adjusted_scale_factor),      // 水平居中
                (x, -1.0) => (x * adjusted_scale_factor, center_y),      // 垂直居中
                (x, y) => (x * adjusted_scale_factor, y * adjusted_scale_factor), // 指定位置
            }
        }
        None => (
            (monitor_size.width as f64 - width) / 2.0,
            (monitor_size.height as f64 - height) / 2.0,
        ),
    };

    // 构建基础窗口配置
    let mut builder = WebviewWindowBuilder::new(&app_handle, &window_id, WebviewUrl::App(url.into()))
        .title(title)
        .shadow(false)
        .transparent(true)
        .visible(loading.unwrap_or(false))
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
    
    // 只有在 loading 为 false 时才需要手动显示窗口
    if !loading.unwrap_or(false) {
        new_window.show().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// 关闭指定ID的窗口
/// 
/// # Arguments
/// 
/// * `app_handle` - Tauri应用句柄
/// * `window_id` - 要关闭的窗口ID
#[tauri::command]
pub async fn close_new_window(
    app_handle: tauri::AppHandle,
    window_id: String,
) -> AppResult<()> {
    let window = app_handle
        .get_webview_window(&window_id)
        .ok_or_else(|| AppError::WindowError(format!("{}", window_id)))?;

    window
        .close()
        .map_err(|e| AppError::WindowError(e.to_string()))?;

    Ok(())
}

/// 设置窗口的置顶状态
/// 
/// # Arguments
/// 
/// * `app_handle` - Tauri应用句柄
/// * `window_id` - 目标窗口ID
/// * `is_always_on_top` - 是否置顶
#[tauri::command]
pub async fn set_window_always_on_top(
    app_handle: tauri::AppHandle,
    window_id: String,
    is_always_on_top: bool,
) -> AppResult<()> {
    let window = app_handle
        .get_webview_window(&window_id)
        .ok_or_else(|| AppError::WindowError(format!("未找到窗口: {}", window_id)))?;

    window
        .set_always_on_top(is_always_on_top)
        .map_err(|e| AppError::WindowError(e.to_string()))?;

    Ok(())
}

/// 检查文件是否存在
/// 
/// # Arguments
/// 
/// * `path` - 要检查的文件路径
/// 
/// # Returns
/// 
/// * `bool` - 文件是否存在
#[tauri::command]
pub fn file_exists(path: String) -> bool {
    Path::new(&path).exists()
}
