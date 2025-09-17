use crate::services::config::utils_get_config;
use crate::services::config::utils_set_config;
use crate::utils::error::{AppError, AppResult};
use parking_lot::{Mutex, RwLock};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{LogicalPosition, WindowEvent};

/// 窗口管理器
pub struct WindowManager {
    window: Arc<RwLock<tauri::WebviewWindow>>,
}

impl WindowManager {
    /// 创建窗口管理器
    pub fn new(window: tauri::WebviewWindow) -> Self {
        Self {
            window: Arc::new(RwLock::new(window)),
        }
    }

    /// 获取窗口句柄
    pub fn get_window(&self) -> Arc<RwLock<tauri::WebviewWindow>> {
        Arc::clone(&self.window)
    }

    /// 设置窗口位置并显示
    pub fn setup_position(&self, app: &tauri::App) -> AppResult<()> {
        let (screen_width, screen_height, scale_factor) = get_screen_info(app)?;
        let position = load_window_position(screen_width, screen_height, scale_factor)?;

        let window = self.window.write();
        window
            .set_position(position)
            .map_err(|e| AppError::Error(e.to_string()))?;
        window.show().map_err(|e| AppError::Error(e.to_string()))?;

        Ok(())
    }

    /// 绑定窗口事件
    pub fn setup_events(&self) -> AppResult<()> {
        let window_read = self.window.read();
        let window_clone = Arc::clone(&self.window);
        let last_move_time = Arc::new(Mutex::new(Instant::now()));

        window_read.on_window_event(move |event| {
            if let WindowEvent::Moved(_) = event {
                handle_window_move(&window_clone, &last_move_time);
            }
        });

        Ok(())
    }
}

fn get_screen_info(app: &tauri::App) -> AppResult<(f64, f64, f64)> {
    let monitor = app
        .primary_monitor()
        .map_err(|e| AppError::Error(format!("无法获取显示器信息: {}", e)))?
        .or_else(|| {
            app.available_monitors()
                .ok()
                .and_then(|monitors| monitors.into_iter().next())
        })
        .ok_or_else(|| AppError::Error("未找到任何显示器".into()))?;

    let size = monitor.size();
    Ok((
        size.width as f64,
        size.height as f64,
        monitor.scale_factor(),
    ))
}

/// 加载窗口位置配置
fn load_window_position(
    screen_width: f64,
    screen_height: f64,
    scale_factor: f64,
) -> AppResult<LogicalPosition<f64>> {
    match utils_get_config("config", vec!["position".to_string()]) {
        Ok(Some(value)) => parse_position_config(value, screen_width, screen_height, scale_factor),
        Ok(None) => Ok(LogicalPosition::new(500.0, 300.0)),
        Err(e) => Err(AppError::Error(format!("读取配置失败: {}", e))),
    }
}

/// 解析位置配置
fn parse_position_config(
    value: serde_json::Value,
    screen_width: f64,
    screen_height: f64,
    scale_factor: f64,
) -> AppResult<LogicalPosition<f64>> {
    let pos = value
        .as_object()
        .ok_or_else(|| AppError::Error("position 配置格式错误".into()))?;

    let x = pos
        .get("x")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| AppError::Error("position.x 配置格式错误".into()))?
        / scale_factor;

    let y = pos
        .get("y")
        .and_then(|v| v.as_f64())
        .ok_or_else(|| AppError::Error("position.y 配置格式错误".into()))?
        / scale_factor;

    // 验证位置是否在屏幕范围内
    if x >= 0.0 && x <= screen_width && y >= 0.0 && y <= screen_height {
        Ok(LogicalPosition::new(x, y))
    } else {
        Ok(LogicalPosition::new(500.0, 300.0))
    }
}

/// 处理窗口移动事件
fn handle_window_move(
    window: &Arc<RwLock<tauri::WebviewWindow>>,
    last_move_time: &Arc<Mutex<Instant>>,
) {
    let last_move_time_clone = Arc::clone(last_move_time);
    let window_inner = Arc::clone(window);

    // 更新最后移动时间
    *last_move_time_clone.lock() = Instant::now();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(100));

        if last_move_time_clone.lock().elapsed() >= Duration::from_millis(100) {
            save_window_position(&window_inner);
        }
    });
}

/// 保存窗口位置
fn save_window_position(window: &Arc<RwLock<tauri::WebviewWindow>>) {
    if let Ok(position) = window.read().outer_position() {
        let mut data = HashMap::new();
        data.insert(
            "position".to_string(),
            json!({"x": position.x, "y": position.y}),
        );

        if let Err(e) = utils_set_config("config", data) {
            let app_error = AppError::from(format!("保存位置时出错: {}", e));
            eprintln!("{}", app_error);
        }
    }
}
