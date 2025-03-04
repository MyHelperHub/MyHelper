use crate::utils::logger::{LogEntry, Logger};
use once_cell::sync::OnceCell;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};

// 存储全局快捷键管理器状态
pub struct HotkeyManager {
    enabled: Mutex<bool>,
    app_handle: Mutex<Option<AppHandle>>,
}

impl HotkeyManager {
    pub fn new() -> Self {
        HotkeyManager {
            enabled: Mutex::new(true),
            app_handle: Mutex::new(None),
        }
    }

    pub fn is_enabled(&self) -> bool {
        *self.enabled.lock().unwrap()
    }

    pub fn set_enabled(&self, enabled: bool) -> bool {
        let mut guard = self.enabled.lock().unwrap();
        *guard = enabled;
        enabled
    }

    pub fn set_app_handle(&self, app_handle: AppHandle) {
        let mut guard = self.app_handle.lock().unwrap();
        *guard = Some(app_handle);
    }

    // 清理所有快捷键资源
    pub fn cleanup(&self) -> Result<(), Box<dyn std::error::Error>> {
        if let Some(app_handle) = self.app_handle.lock().unwrap().as_ref() {
            app_handle.global_shortcut().unregister_all()?;
            Logger::write_log(LogEntry {
                level: "INFO".to_string(),
                message: "已清理所有全局快捷键".to_string(),
                timestamp: String::new(),
                details: None,
            })
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;
        }
        Ok(())
    }

    // 获取全局单例
    pub fn global() -> &'static HotkeyManager {
        static HOTKEY_MANAGER: OnceCell<HotkeyManager> = OnceCell::new();
        HOTKEY_MANAGER.get_or_init(|| HotkeyManager::new())
    }
}

// 实现Drop trait，确保资源释放
impl Drop for HotkeyManager {
    fn drop(&mut self) {
        if let Err(e) = self.cleanup() {
            Logger::write_log(LogEntry {
                level: "ERROR".to_string(),
                message: format!("清理快捷键时出错: {}", e),
                timestamp: String::new(),
                details: None,
            })
            .unwrap_or_else(|_| {});
        }
    }
}

/// 创建全局快捷键插件
pub fn init() -> impl tauri::plugin::Plugin<tauri::Wry> {
    let hotkey_manager = HotkeyManager::global();

    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            // 存储app_handle以便后续使用
            hotkey_manager.set_app_handle(app.clone());

            // 如果快捷键被禁用，直接返回
            if !hotkey_manager.is_enabled() {
                return;
            }

            if event.state() != ShortcutState::Pressed {
                return;
            }

            match () {
                // Ctrl+\
                _ if shortcut.matches(Modifiers::CONTROL, Code::Backslash) => {
                    let _ = app.emit("hotkey-triggered", "console_log");
                }
                // Ctrl+Delete
                _ if shortcut.matches(Modifiers::CONTROL, Code::Delete) => {
                    let _ = app.emit("hotkey-triggered", "delete");
                }
                // 可在此添加更多快捷键
                _ => {} // 未匹配的快捷键
            }
        })
        .with_shortcuts(["ctrl+\\", "ctrl+delete"])
        .expect("无法注册快捷键")
        .build()
}
