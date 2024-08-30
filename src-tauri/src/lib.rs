mod command;
mod utils;

use command::get_app_icon::get_app_icon;
use command::get_web_icon::get_web_icon;
use command::home::set_window_size;
use command::settings::open_new_window;
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 获取应用的主窗口对象
            let window = app.get_webview_window("main").unwrap();
            window.set_always_on_top(true)?;
            window.show().unwrap();

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
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "exit" => {
                        app.exit(0);
                    }
                    "show" => {
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

            Ok(())
        })
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            set_window_size,
            open_new_window,
            get_app_icon,
            get_web_icon
        ])
        .run(tauri::generate_context!())
        .expect("MyHelper启动失败...");
}
