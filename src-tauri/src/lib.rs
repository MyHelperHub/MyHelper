mod command;
mod mh_plugin;
mod utils;

use crate::utils::config::utils_set_config;
use crate::utils::database::init_database;
use crate::utils::error::{AppError, AppResult};
use command::*;
use mh_plugin::*;
use parking_lot::{Mutex, RwLock};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{LogicalPosition, Manager, Runtime, WindowEvent};
use tauri_plugin_autostart::MacosLauncher;

/** 初始化 */
fn init() -> AppResult<()> {
    // 初始化数据库
    init_database().map_err(|e| AppError::Error(format!("初始化数据库失败: {}", e)))?;

    // 同步插件配置
    tauri::async_runtime::spawn_blocking(|| {
        tauri::async_runtime::block_on(mh_plugin::sync::sync_plugins())
    });

    // 初始化应用观察者
    observe_app().map_err(|e| AppError::Error(format!("初始化应用观察者失败: {}", e)))?;

    Ok(())
}

// 获取屏幕信息
fn get_screen_info(app: &tauri::App) -> AppResult<(f64, f64, f64)> {
    // 首先尝试获取主显示器
    let monitor = match app.primary_monitor() {
        Ok(Some(m)) => m,
        Ok(None) => {
            // 如果没有主显示器,尝试获取任何可用显示器
            app.available_monitors()
                .map_err(|e| AppError::Error(format!("无法获取显示器列表: {}", e)))?
                .into_iter()
                .next()
                .ok_or_else(|| AppError::Error("未找到任何显示器".into()))?
        }
        Err(e) => return Err(AppError::Error(format!("无法获取显示器信息: {}", e))),
    };

    let size = monitor.size();
    Ok((
        size.width as f64,
        size.height as f64,
        monitor.scale_factor(),
    ))
}

// 获取窗口位置
fn get_window_position(
    screen_width: f64,
    screen_height: f64,
    scale_factor: f64,
) -> AppResult<LogicalPosition<f64>> {
    match utils::config::utils_get_config("config", vec!["position".to_string()]) {
        Ok(Some(value)) => {
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

            if x >= 0.0 && x <= screen_width && y >= 0.0 && y <= screen_height {
                Ok(LogicalPosition::new(x, y))
            } else {
                Ok(LogicalPosition::new(500.0, 300.0))
            }
        }
        Ok(None) => Ok(LogicalPosition::new(500.0, 300.0)),
        Err(e) => Err(AppError::Error(format!("读取配置失败: {}", e))),
    }
}

// 辅助函数：设置窗口
fn setup_window(
    window: &Arc<RwLock<tauri::WebviewWindow>>,
    position: LogicalPosition<f64>,
) -> AppResult<()> {
    let window_write = window.write();
    window_write
        .set_position(position)
        .map_err(|e| AppError::Error(e.to_string()))?;
    window_write
        .show()
        .map_err(|e| AppError::Error(e.to_string()))?;
    Ok(())
}

// 辅助函数：设置窗口事件
fn setup_window_events(window: &Arc<RwLock<tauri::WebviewWindow>>) -> AppResult<()> {
    let window_read = window.read();
    let window_clone = Arc::clone(window);

    // 创建移动窗口时所需的时间记录
    let last_move_time = Arc::new(Mutex::new(Instant::now()));

    window_read.on_window_event(move |event| {
        if let WindowEvent::Moved(_) = event {
            let last_move_time_clone = Arc::clone(&last_move_time);
            let window_inner = Arc::clone(&window_clone);

            // 更新最后移动时间
            *last_move_time_clone.lock() = Instant::now();

            // 创建新线程处理位置保存
            std::thread::spawn(move || {
                std::thread::sleep(Duration::from_millis(100));
                if last_move_time_clone.lock().elapsed() >= Duration::from_millis(100) {
                    if let Ok(position) = window_inner.read().outer_position() {
                        let mut data = HashMap::new();
                        data.insert(
                            "position".to_string(),
                            json!({"x": position.x, "y": position.y}),
                        );
                        if let Err(e) = utils_set_config("config", data) {
                            eprintln!("保存位置时出错: {}", e);
                        }
                    }
                }
            });
        }
    });

    Ok(())
}

// 辅助函数：设置系统托盘
fn setup_tray<R: Runtime>(
    app: &tauri::App<R>,
    window: &Arc<RwLock<tauri::WebviewWindow>>,
) -> AppResult<()> {
    let handle = app.app_handle();
    let window_clone = Arc::clone(window);

    // 创建菜单项
    let show_item = {
        let handle_clone = handle.clone();
        MenuItemBuilder::with_id("show", "显示窗口")
            .build(&handle_clone)
            .map_err(|e| AppError::Error(format!("创建菜单项失败: {}", e)))?
    };

    let exit_item = {
        let handle_clone = handle.clone();
        MenuItemBuilder::with_id("exit", "退出")
            .build(&handle_clone)
            .map_err(|e| AppError::Error(format!("创建退出菜单项失败: {}", e)))?
    };

    // 创建菜单
    let menu = {
        let handle_clone = handle.clone();
        MenuBuilder::new(&handle_clone)
            .item(&show_item)
            .separator()
            .item(&exit_item)
            .build()
            .map_err(|e| AppError::Error(format!("创建菜单失败: {}", e)))?
    };

    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))
        .map_err(|e| AppError::Error(format!("加载图标失败: {}", e)))?;

    let window_for_menu = Arc::clone(&window_clone);
    let tray = TrayIconBuilder::new()
        .tooltip("MyHelper")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .icon(icon.clone())
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "exit" => app.exit(0),
            "show" => {
                let window = window_for_menu.read();
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
            _ => (),
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.unminimize();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(handle)
        .map_err(|e| AppError::Error(format!("无法创建系统托盘: {}", e)))?;

    // 设置托盘图标
    tray.set_icon(Some(icon))
        .map_err(|e| AppError::Error(format!("设置托盘图标失败: {}", e)))?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(e) = tauri::Builder::default()
        .manage(Arc::new(GlobalData::default()))
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .ok_or_else(|| AppError::Error("主窗口未找到".into()))?;
            let window = Arc::new(RwLock::new(window));

            // 设置全局 AppHandle
            utils::app_handle::AppHandleManager::set(app.handle().clone());

            let (screen_width, screen_height, scale_factor) = get_screen_info(app)?;
            let position = get_window_position(screen_width, screen_height, scale_factor)?;

            setup_window(&window, position)?;
            setup_window_events(&window)?;
            setup_tray(app, &window)?;
            init()?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_window_size,
            get_app_icon,
            get_web_icon,
            set_local_icon,
            set_logo,
            delete_icon,
            file_exists,
            get_config,
            set_config,
            delete_config,
            open_web_or_app,
            create_new_window,
            window_control,
            start_clipboard_listener,
            stop_clipboard_listener,
            write_clipboard,
            paste,
            mh_plugin_install,
            mh_plugin_install_local,
            mh_plugin_uninstall,
            mh_plugin_analyze_package,
            set_global_data,
            get_global_data,
            delete_global_data,
            mh_get_self_config,
            mh_set_self_config,
            mh_delete_self_config,
            open_devtools,
            write_log,
            get_config_value,
            set_config_value,
            delete_config_value,
            set_plugin_config_value,
            get_plugin_config_value,
            delete_plugin_config_value,
            set_hotkey_enabled,
        ])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(utils::hotkey::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]), /* arbitrary number of args to pass to your app */
        ))
        .run(tauri::generate_context!())
    {
        eprintln!("MyHelper启动失败: {}", e);
        std::process::exit(1);
    }
}
