use crate::utils::error::{AppError, AppResult};
use parking_lot::RwLock;
use std::sync::Arc;
use tauri::image::Image;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, Runtime};

/// 设置系统托盘
pub fn setup<R: Runtime>(
    app: &tauri::App<R>,
    window: Arc<RwLock<tauri::WebviewWindow>>,
) -> AppResult<()> {
    let handle = app.app_handle();

    // 创建菜单
    let menu = create_tray_menu(handle)?;

    // 创建托盘图标
    let icon = load_tray_icon()?;

    // 构建托盘
    let tray = build_tray(handle, window, &menu, &icon)?;

    // 设置托盘图标
    tray.set_icon(Some(icon))
        .map_err(|e| AppError::Error(format!("设置托盘图标失败: {}", e)))?;

    Ok(())
}

/// 创建托盘菜单
fn create_tray_menu<R: Runtime>(handle: &tauri::AppHandle<R>) -> AppResult<tauri::menu::Menu<R>> {
    let show_item = MenuItemBuilder::with_id("show", "显示窗口")
        .build(handle)
        .map_err(|e| AppError::Error(format!("创建菜单项失败: {}", e)))?;

    let exit_item = MenuItemBuilder::with_id("exit", "退出")
        .build(handle)
        .map_err(|e| AppError::Error(format!("创建退出菜单项失败: {}", e)))?;

    MenuBuilder::new(handle)
        .item(&show_item)
        .separator()
        .item(&exit_item)
        .build()
        .map_err(|e| AppError::Error(format!("创建菜单失败: {}", e)))
}

/// 加载托盘图标
fn load_tray_icon() -> AppResult<Image<'static>> {
    Image::from_bytes(include_bytes!("../../icons/32x32.png"))
        .map_err(|e| AppError::Error(format!("加载图标失败: {}", e)))
}

/// 构建托盘
fn build_tray<R: Runtime>(
    handle: &tauri::AppHandle<R>,
    window: Arc<RwLock<tauri::WebviewWindow>>,
    menu: &tauri::menu::Menu<R>,
    icon: &Image<'static>,
) -> AppResult<tauri::tray::TrayIcon<R>> {
    let window_for_menu = Arc::clone(&window);

    TrayIconBuilder::new()
        .tooltip("MyHelper")
        .menu(menu)
        .show_menu_on_left_click(false)
        .icon(icon.clone())
        .on_menu_event(move |app, event| handle_menu_event(app, event, &window_for_menu))
        .on_tray_icon_event(handle_tray_click)
        .build(handle)
        .map_err(|e| AppError::Error(format!("无法创建系统托盘: {}", e)))
}

/// 处理菜单事件
fn handle_menu_event<R: Runtime>(
    app: &tauri::AppHandle<R>,
    event: tauri::menu::MenuEvent,
    window: &Arc<RwLock<tauri::WebviewWindow>>,
) {
    match event.id().as_ref() {
        "exit" => app.exit(0),
        "show" => {
            let window = window.read();
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
        _ => (),
    }
}

/// 处理托盘点击事件
fn handle_tray_click<R: Runtime>(
    tray: &tauri::tray::TrayIcon<R>,
    event: tauri::tray::TrayIconEvent,
) {
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
}
