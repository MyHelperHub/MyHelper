mod command;
mod core;
mod mh_plugin;
mod services;
mod utils;

use crate::core::init::init_app;
use crate::core::tray::setup as setup_tray;
use crate::core::window::WindowManager;
use command::*;
use mh_plugin::*;
use std::sync::Arc;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;
use utils::error::AppError;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(e) = tauri::Builder::default()
        .manage(Arc::new(GlobalData::default()))
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .ok_or_else(|| AppError::Error("主窗口未找到".into()))?;

            // 设置全局 AppHandle
            crate::core::app_handle::AppHandleManager::set(app.handle().clone());

            // 创建窗口管理器
            let window_manager = WindowManager::new(window);
            let window = window_manager.get_window();

            // 设置窗口位置和事件
            window_manager.setup_position(app)?;
            window_manager.setup_events()?;

            // 设置系统托盘
            setup_tray(app, window)?;

            // 初始化应用程序
            init_app()?;

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
        .plugin(crate::core::hotkey::init())
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
