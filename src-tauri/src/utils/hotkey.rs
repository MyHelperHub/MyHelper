use crate::utils::error::{AppError, AppResult};
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

/// 初始化全局快捷键
pub fn init_hotkeys(app_handle: &AppHandle) -> AppResult<()> {
    // 注册 Ctrl+\ 快捷键
    register_hotkey(app_handle, "ctrl+\\", "console_log")?;
    
    Ok(())
}

/// 注册全局快捷键
pub fn register_hotkey(app_handle: &AppHandle, hotkey: &str, action: &str) -> AppResult<()> {
    // 获取全局快捷键管理器
    let manager = app_handle.global_shortcut();
    
    // 如果快捷键已注册，先取消注册
    if manager.is_registered(hotkey) {
        manager.unregister(hotkey)
            .map_err(|e| AppError::Error(format!("取消注册快捷键失败: {}", e)))?;
    }
    
    // 注册快捷键
    manager.register(hotkey)
        .map_err(|e| AppError::Error(format!("注册快捷键失败: {}", e)))?;
    
    // 创建一个闭包来处理快捷键事件
    let action_str = action.to_string();
    let app_handle_clone = app_handle.clone();
    
    // 设置快捷键处理函数
    let _ = manager.on_shortcut(hotkey, move |_app, _shortcut, _event| {
        // 发送事件到前端
        let _ = app_handle_clone.emit("hotkey-triggered", &action_str);
    });
    
    Ok(())
}

/// 取消注册全局快捷键
pub fn unregister_hotkey(app_handle: &AppHandle, hotkey: &str) -> AppResult<()> {
    // 取消注册全局快捷键
    app_handle
        .global_shortcut()
        .unregister(hotkey)
        .map_err(|e| AppError::Error(format!("取消注册快捷键失败: {}", e)))?;
    
    Ok(())
} 