use crate::utils::error::{AppError, AppResult};
use crate::utils::reqwest::create_web_client;
use serde_json::Value;
use std::path::Path;
use tauri::{image::Image, LogicalSize, Manager, WebviewUrl, WebviewWindowBuilder};

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
        .ok_or_else(|| AppError::Error("未找到 main 窗口".to_string()))?;

    let monitor = window
        .current_monitor()
        .map_err(|e| AppError::Error(e.to_string()))?
        .ok_or_else(|| AppError::Error("未找到监视器".to_string()))?;

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
        .map_err(|e| AppError::Error(e.to_string()))?;

    // 设置网页内容的缩放比例
    window
        .set_zoom(adjusted_scale_factor)
        .map_err(|e| AppError::Error(e.to_string()))?;

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
    // 获取显示器信息，增加容错处理
    let monitor = match app_handle.primary_monitor() {
        Ok(Some(m)) => m,
        Ok(None) => {
            // 如果没有主显示器，尝试获取任何可用显示器
            app_handle
                .available_monitors()
                .map_err(|e| AppError::Error(format!("无法获取显示器列表: {}", e)))?
                .into_iter()
                .next()
                .ok_or_else(|| AppError::Error("未找到任何可用显示器".to_string()))?
        }
        Err(e) => return Err(AppError::Error(format!("获取显示器信息失败: {}", e))),
    };

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
            let screen_width = monitor_size.width as f64;
            let screen_height = monitor_size.height as f64;

            // 先将屏幕尺寸转换为逻辑像素
            let logical_screen_width = screen_width / monitor.scale_factor();
            let logical_screen_height = screen_height / monitor.scale_factor();

            // 使用逻辑像素计算中心位置
            let center_x = (logical_screen_width - base_width) / 2.0;
            let center_y = (logical_screen_height - base_height) / 2.0;

            match (pos_x, pos_y) {
                (-1.0, -1.0) => (center_x, center_y), // 完全居中
                (-1.0, y) => (center_x, y),           // 水平居中
                (x, -1.0) => (x, center_y),           // 垂直居中
                (x, y) => (x, y),                     // 指定位置
            }
        }
        None => {
            let screen_width = monitor_size.width as f64;
            let screen_height = monitor_size.height as f64;

            // 先将屏幕尺寸转换为逻辑像素
            let logical_screen_width = screen_width / monitor.scale_factor();
            let logical_screen_height = screen_height / monitor.scale_factor();

            // 使用逻辑像素计算中心位置
            let center_x = (logical_screen_width - base_width) / 2.0;
            let center_y = (logical_screen_height - base_height) / 2.0;

            (center_x, center_y)
        }
    };

    // 构建基础窗口配置
    let mut builder =
        WebviewWindowBuilder::new(&app_handle, &window_id, WebviewUrl::App(url.into()))
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
                if let Ok(client) = create_web_client() {
                    if let Ok(response) = client.get(&icon_path_clone).send().await {
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

/// 窗口操作类型
#[derive(Debug)]
pub enum WindowOperation {
    Close = 0,
    Minimize = 1,
    Maximize = 2,
    Restore = 3,
    ToggleAlwaysOnTop = 4, // 切换窗口置顶状态
}

impl TryFrom<i32> for WindowOperation {
    type Error = AppError;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(WindowOperation::Close),
            1 => Ok(WindowOperation::Minimize),
            2 => Ok(WindowOperation::Maximize),
            3 => Ok(WindowOperation::Restore),
            4 => Ok(WindowOperation::ToggleAlwaysOnTop),
            _ => Err(AppError::Error("无效的窗口操作类型".to_string())),
        }
    }
}

/// 统一的窗口控制函数
///
/// # Arguments
///
/// * `window` - 触发该命令的窗口
/// * `app_handle` - Tauri应用句柄
/// * `operation` - 操作类型：
///   - 0: 关闭窗口
///   - 1: 最小化窗口
///   - 2: 最大化窗口
///   - 3: 还原窗口
///   - 4: 切换窗口置顶状态
#[tauri::command]
pub async fn window_control(
    window: tauri::Window,
    app_handle: tauri::AppHandle,
    operation: i32,
    params: Option<Value>,
) -> AppResult<()> {
    // 从 params 中获取 window_id
    let target_window_id = params
        .as_ref()
        .and_then(|v| v.get("window_id"))
        .and_then(|v| v.as_str())
        .unwrap_or_else(|| window.label());

    // 检查权限：main窗口可以控制任何窗口，其他窗口只能控制自己
    if window.label() != "main" && target_window_id != window.label() {
        return Err(AppError::Error("不允许控制其他插件的窗口".to_string()));
    }

    let target_window = app_handle
        .get_webview_window(target_window_id)
        .ok_or_else(|| AppError::Error(format!("未找到窗口: {}", target_window_id)))?;

    // 将整数转换为操作类型
    let operation = WindowOperation::try_from(operation)?;

    // 执行相应的窗口操作
    match operation {
        WindowOperation::Close => target_window.close(),
        WindowOperation::Minimize => target_window.minimize(),
        WindowOperation::Maximize => target_window.maximize(),
        WindowOperation::Restore => target_window.unminimize(),
        WindowOperation::ToggleAlwaysOnTop => {
            let always_on_top = params
                .as_ref()
                .and_then(|v| v.get("always_on_top"))
                .and_then(|v| v.as_bool())
                .unwrap_or(true);
            target_window.set_always_on_top(always_on_top)
        }
    }
    .map_err(|e| AppError::Error(e.to_string()))?;

    Ok(())
}

#[tauri::command]
pub fn open_devtools(app_handle: tauri::AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        if !window.is_devtools_open() {
            window.open_devtools();
        } else {
            window.close_devtools();
        }
    }
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
