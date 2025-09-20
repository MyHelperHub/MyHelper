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
        .invoke_handler(generate_app_handlers!())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(crate::core::hotkey::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .run(tauri::generate_context!())
    {
        let app_error = AppError::from(format!("MyHelper启动失败: {}", e));
        eprintln!("{}", app_error);
        std::process::exit(1);
    }
}
