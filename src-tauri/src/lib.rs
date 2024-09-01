mod command;
mod utils;

use command::get_app_icon::get_app_icon;
use command::get_web_icon::get_web_icon;
use command::home::set_window_size;
use command::settings::open_new_window;
use std::sync::{Arc, RwLock};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 获取应用的主窗口对象，并使用 Arc<RwLock<>> 进行包装
            let window = Arc::new(RwLock::new(app.get_webview_window("main").unwrap()));

            // 克隆 Arc 指针，而不是直接克隆 window 对象
            let window_clone = Arc::clone(&window);

            // 监听窗口移动事件
            let window_clone_for_event = Arc::clone(&window_clone);
            window_clone.read().unwrap().on_window_event(move |event| {
                if let WindowEvent::Moved { .. } = event {
                    let po = window_clone_for_event
                        .read()
                        .unwrap()
                        .outer_position()
                        .unwrap();
                    println!("窗口位置：{:?}", po);
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
                    let window_clone_for_menu = Arc::clone(&window_clone);
                    match event.id().as_ref() {
                        "exit" => {
                            app.exit(0);
                        }
                        "show" => {
                            let window = window_clone_for_menu.read().unwrap();
                            window.unminimize().unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        _ => (),
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    // 处理托盘图标点击事件，左键点击时显示主窗口
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
