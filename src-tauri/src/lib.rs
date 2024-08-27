mod command;

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
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "exit" => {
                        app.exit(0);
                    }
                    "show" => {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    _ => (),
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
                            let _ = webview_window.show();
                            let _ = webview_window.set_focus();
                        }
                    }
                })
                .build(app)?;
            let _ = tray.set_icon(Some(icon));
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![set_window_size, open_new_window])
        .run(tauri::generate_context!())
        .expect("MyHelper启动失败...");
}
