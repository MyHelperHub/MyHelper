mod command;
mod utils;

use command::get_app_icon::get_app_icon;
use command::get_web_icon::get_web_icon;
use command::home::set_window_size;
use command::settings::open_new_window;
use serde_json::json;
use std::{
    collections::HashMap,
    sync::{Arc, Mutex, RwLock},
    time::{Duration, Instant},
};
use tauri::{
    image::Image, menu::{MenuBuilder, MenuItemBuilder}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, LogicalPosition, Manager, WindowEvent
};
use utils::config::{get_config, set_config};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = Arc::new(RwLock::new(app.get_webview_window("main").unwrap()));

            // 定义窗口位置
            let position = match get_config(&["position"]) {
                Ok(Some(value)) => {
                    let pos = value.as_object().unwrap();
                    let x = pos.get("x").unwrap().as_i64().unwrap() as f64;
                    let y = pos.get("y").unwrap().as_i64().unwrap() as f64;
                    LogicalPosition::new(x, y)
                }
                Ok(None) => {
                    LogicalPosition::new(500.0, 300.0)
                }
                Err(e) => {
                    eprintln!("读取配置时出错: {}", e);
                    LogicalPosition::new(500.0, 300.0) // 使用默认位置
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
                        if last_move_time_inner.lock().unwrap().elapsed() >= Duration::from_millis(100) {
                            let position = window_inner.read().unwrap().outer_position().unwrap();
                            // println!("窗口位置：{:?}", position);
                            let mut data = HashMap::new();
                            data.insert("position".to_string(), json!({"x": position.x, "y": position.y}));
                            if let Err(e) = set_config(data) {
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

            let icon = Image::from_bytes(include_bytes!("../icons/icon.png"))?;
            let tray = TrayIconBuilder::new()
                .tooltip("MyHelper")
                .menu(&menu)
                .on_menu_event(move |app, event| {
                    match event.id().as_ref() {
                        "exit" => app.exit(0),
                        "show" => {
                            let window = window.read().unwrap();
                            window.unminimize().unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        _ => (),
                    }
                })
                .on_tray_icon_event(move |tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(webview_window) = app.get_webview_window("main") {
                            println!("托盘图标被点击");
                            webview_window.unminimize().unwrap();
                            webview_window.show().unwrap();
                            webview_window.set_focus().unwrap();
                        }
                    }
                })
                .build(app)?;
            let _ = tray.set_icon(Some(icon));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_window_size,
            open_new_window,
            get_app_icon,
            get_web_icon
        ])
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .run(tauri::generate_context!())
        .expect("MyHelper启动失败...");
}
