mod command;

use command::home::set_window_size;
use command::settings::open_new_window;
use tauri::{image, Manager};
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
            let icon = load_icon(std::path::Path::new("icons/icon.png"));
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
            tray.set_icon(icon);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![set_window_size, open_new_window])
        .run(tauri::generate_context!())
        .expect("MyHelper启动失败...");
}
fn load_icon(path: &std::path::Path) -> tray_icon::Icon {
    let (icon_rgba, icon_width, icon_height) = {
        let image = image::open(path)
            .expect("Failed to open icon path")
            .into_rgba8();
        let (width, height) = image.dimensions();
        let rgba = image.into_raw();
        (rgba, width, height)
    };
    tray_icon::Icon::from_rgba(icon_rgba, icon_width, icon_height).expect("Failed to open icon")
}

// https://github.com/tauri-apps/tray-icon/blob/13cabcd5184e7721c42c2c1262af5e0468146003/examples/tao.rs#L19-L42