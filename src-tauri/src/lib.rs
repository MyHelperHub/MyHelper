mod command;
mod utils;

use command::*;
use serde_json::json;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex, RwLock},
    time::{Duration, Instant},
};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    LogicalPosition, Manager, WindowEvent,
};
use utils::config::{utils_get_config, utils_set_config};
/** 初始化 */
fn init() {
    // 监听窗口变化
    observe_app();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let window = Arc::new(RwLock::new(app.get_webview_window("main").unwrap()));
            // 获取主屏幕的尺寸
            let main_screen = app.primary_monitor();

            // 处理 main_screen 为 Err 或 None 的情况
            let (screen_width, screen_height, scale_factor) = match main_screen {
                Ok(Some(monitor)) => {
                    let size = monitor.size();
                    (
                        size.width as f64,
                        size.height as f64,
                        monitor.scale_factor(),
                    )
                }
                Ok(None) => {
                    println!("没有找到主屏幕，使用默认屏幕尺寸");
                    (1920.0, 1080.0, 1.0) // 默认缩放比例
                }
                Err(e) => {
                    eprintln!("获取主屏幕信息时出错: {:?}, 使用默认屏幕尺寸", e);
                    (1920.0, 1080.0, 1.0) // 默认缩放比例
                }
            };

            // 定义窗口位置
            let position = match utils_get_config(vec!["position".to_string()]) {
                Ok(Some(value)) => {
                    let pos = value.as_object().unwrap();
                    let x = pos.get("x").unwrap().as_f64().unwrap() / scale_factor;
                    let y = pos.get("y").unwrap().as_f64().unwrap() / scale_factor;

                    // 检查位置是否在屏幕范围内
                    if x >= 0.0 && x <= screen_width && y >= 0.0 && y <= screen_height {
                        LogicalPosition::new(x, y)
                    } else {
                        println!("窗口位置超出屏幕范围，使用默认位置");
                        LogicalPosition::new(500.0, 300.0)
                    }
                }
                Ok(None) => LogicalPosition::new(500.0, 300.0),
                Err(e) => {
                    eprintln!("读取配置时出错: {}", e);
                    LogicalPosition::new(500.0, 300.0)
                }
            };

            // tauri基础操作
            {
                let window_write = window.write().unwrap();
                window_write.set_position(position).unwrap();
                window_write.show().unwrap();
            }

            // 创建移动窗口时所需的克隆变量
            let last_move_time = Arc::new(Mutex::new(Instant::now()));
            let last_move_time_clone = Arc::clone(&last_move_time);
            let window_clone = Arc::clone(&window);

            // 监听窗口移动事件
            window.read().unwrap().on_window_event(move |event| {
                if let WindowEvent::Moved { .. } = event {
                    // 更新最后移动时间
                    *last_move_time_clone.lock().unwrap() = Instant::now();

                    let window_inner = Arc::clone(&window_clone);
                    let last_move_time_inner = Arc::clone(&last_move_time_clone);

                    std::thread::spawn(move || {
                        std::thread::sleep(Duration::from_millis(100));
                        if last_move_time_inner.lock().unwrap().elapsed()
                            >= Duration::from_millis(100)
                        {
                            let position = window_inner.read().unwrap().outer_position().unwrap();
                            // println!("窗口位置：{:?}", position);
                            let mut data = HashMap::new();
                            data.insert(
                                "position".to_string(),
                                json!({"x": position.x, "y": position.y}),
                            );
                            if let Err(e) = utils_set_config(data) {
                                eprintln!("保存位置时出错: {}", e);
                            }
                        }
                    });
                }
            });

            let item_show = MenuItemBuilder::with_id("show", "显示窗口").build(app)?;
            let item_exit = MenuItemBuilder::with_id("exit", "退出").build(app)?;

            let menu = MenuBuilder::new(app)
                .items(&[&item_show])
                .separator()
                .items(&[&item_exit])
                .build()?;

            let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;
            let tray = TrayIconBuilder::new()
                .tooltip("MyHelper")
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "exit" => app.exit(0),
                    "show" => {
                        let window = window.read().unwrap();
                        window.unminimize().unwrap();
                        window.show().unwrap();
                        window.set_focus().unwrap();
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| {
                    // 处理托盘图标点击事件，左键点击时切换窗口显示/隐藏状态
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(webview_window) = app.get_webview_window("main") {
                            if webview_window.is_visible().unwrap() {
                                // 窗口当前是显示状态，隐藏它
                                webview_window.hide().unwrap();
                            } else {
                                // 窗口当前是隐藏状态，显示它
                                webview_window.unminimize().unwrap();
                                webview_window.show().unwrap();
                                webview_window.set_focus().unwrap();
                            }
                        }
                    }
                })
                .build(app)?;
            let _ = tray.set_icon(Some(icon));
            init();
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
            close_new_window,
            set_window_always_on_top,
            start_clipboard_listener,
            stop_clipboard_listener,
            write_clipboard,
            paste,
            mh_plugin_install,
            mh_plugin_uninstall
        ])
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("MyHelper启动失败...");
}
