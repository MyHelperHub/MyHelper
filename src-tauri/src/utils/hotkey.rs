use crate::utils::app_handle::AppHandleManager;
use crate::utils::logger::{LogEntry, Logger};
use once_cell::sync::OnceCell;
use parking_lot::RwLock;
use tauri::{AppHandle, Emitter};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, ShortcutState};

// 存储全局快捷键管理器状态
pub struct HotkeyManager {
    enabled: RwLock<bool>,
}

impl HotkeyManager {
    pub fn new() -> Self {
        HotkeyManager {
            enabled: RwLock::new(false),
        }
    }

    pub fn is_enabled(&self) -> bool {
        *self.enabled.read()
    }

    pub fn set_enabled(&self, enabled: bool) -> bool {
        // 首先检查状态是否改变，避免不必要的操作
        {
            let current = *self.enabled.read();
            if current == enabled {
                return enabled;
            }
        }
        
        // 尝试更改状态并执行相应操作
        let result = if let Some(app_handle) = AppHandleManager::get() {
            if enabled {
                // 启用快捷键，注册快捷键
                match self.register_hotkeys(app_handle) {
                    Ok(_) => {
                        *self.enabled.write() = true;
                        true
                    },
                    Err(e) => {
                        // 注册失败，记录日志但不改变状态
                        Logger::write_log(LogEntry {
                            level: "ERROR".to_string(),
                            message: format!("注册快捷键失败: {}", e),
                            timestamp: String::new(),
                            details: None,
                        }).unwrap_or_else(|_| {});
                        false
                    }
                }
            } else {
                // 禁用快捷键，取消注册
                match self.unregister_hotkeys(app_handle) {
                    Ok(_) => {
                        *self.enabled.write() = false;
                        false
                    },
                    Err(_) => false
                }
            }
        } else {
            // 无法获取 app_handle
            false
        };
        
        result
    }

    // 注册快捷键
    fn register_hotkeys(&self, app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        let shortcuts = ["ctrl+\\", "ctrl+delete"];
        
        for shortcut in shortcuts {
            app.global_shortcut().register(shortcut)?;
        }

        Ok(())
    }

    // 取消注册快捷键
    fn unregister_hotkeys(&self, app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
        app.global_shortcut().unregister_all()?;

        Ok(())
    }

    // 清理所有快捷键资源
    pub fn cleanup(&self) -> Result<(), Box<dyn std::error::Error>> {
        if self.is_enabled() {
            if let Some(app_handle) = AppHandleManager::get() {
                self.unregister_hotkeys(app_handle)?;
                
                // 重置状态
                *self.enabled.write() = false;
            }
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
        .build()
}
