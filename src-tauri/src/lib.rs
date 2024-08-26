mod command;

use command::home::set_window_size;
use command::settings::open_new_window;
use tauri::Manager;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            // 设置窗口大小为 200x200
            window.set_always_on_top(true)?;

            let toggle = MenuItemBuilder::with_id("toggle", "Toggle").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&toggle]).build()?;
            let tray = TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "toggle" => {
                        println!("toggle clicked");
                    }
                    _ => (),
                })
                .on_tray_icon_event(|tray, event| {
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
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![set_window_size, open_new_window])
        .run(tauri::generate_context!())
        .expect("MyHelper启动失败...");
}
