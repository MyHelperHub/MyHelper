use crate::utils::app_handle::AppHandleManager;
use crate::utils::logger::{LogEntry, Logger};
use once_cell::sync::OnceCell;
use parking_lot::RwLock;
use std::collections::HashMap;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

// 存储全局快捷键管理器状态
pub struct HotkeyManager {
    enabled: RwLock<bool>,
    // 存储快捷键配置
    hotkeys: RwLock<HashMap<String, String>>,
    // 反向映射
    shortcut_to_action: RwLock<HashMap<String, String>>,
}

impl HotkeyManager {
    pub fn new() -> Self {
        HotkeyManager {
            enabled: RwLock::new(false),
            hotkeys: RwLock::new(HashMap::new()),
            shortcut_to_action: RwLock::new(HashMap::new()),
        }
    }

    pub fn is_enabled(&self) -> bool {
        *self.enabled.read()
    }

    // 设置新的快捷键配置
    pub fn set_hotkeys(&self, hotkeys: Vec<(String, String)>) -> bool {
        if let Some(app_handle) = AppHandleManager::get() {
            // 先取消所有已注册的快捷键
            if self.is_enabled() {
                if let Err(e) = self.unregister_hotkeys(app_handle) {
                    Logger::write_log(LogEntry {
                        level: "ERROR".to_string(),
                        message: format!("取消注册快捷键失败: {}", e),
                        timestamp: String::new(),
                        details: None,
                    })
                    .unwrap_or_else(|_| {});
                    return false;
                }
            }

            // 如果没有快捷键需要注册，则禁用总开关并返回成功
            if hotkeys.is_empty() {
                *self.enabled.write() = false;

                // 清空现有配置
                {
                    let mut hotkeys_map = self.hotkeys.write();
                    hotkeys_map.clear();
                    let mut shortcut_map = self.shortcut_to_action.write();
                    shortcut_map.clear();
                }

                return true;
            }

            // 更新快捷键配置
            {
                let mut hotkeys_map = self.hotkeys.write();
                let mut shortcut_map = self.shortcut_to_action.write();

                // 清空现有配置
                hotkeys_map.clear();
                shortcut_map.clear();

                // 预先分配容量，避免重新分配
                hotkeys_map.reserve(hotkeys.len());
                shortcut_map.reserve(hotkeys.len());

                // 批量插入新键
                for (action, key) in hotkeys {
                    // 标准化快捷键格式
                    let normalized_key = self.normalize_shortcut(&key);
                    hotkeys_map.insert(action.clone(), normalized_key.clone());
                    shortcut_map.insert(normalized_key, action);
                }
            }

            // 注册新的快捷键
            if let Err(e) = self.register_configured_hotkeys(app_handle) {
                Logger::write_log(LogEntry {
                    level: "ERROR".to_string(),
                    message: format!("注册配置的快捷键失败: {}", e),
                    timestamp: String::new(),
                    details: None,
                })
                .unwrap_or_else(|_| {});
                return false;
            }

            // 设置总开关为启用状态
            *self.enabled.write() = true;
            return true;
        }

        false
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
                // 读取当前配置的快捷键
                let hotkeys = self.hotkeys.read();
                if hotkeys.is_empty() {
                    false
                } else {
                    // 启用快捷键，注册快捷键
                    match self.register_configured_hotkeys(app_handle) {
                        Ok(_) => {
                            *self.enabled.write() = true;
                            true
                        }
                        Err(e) => {
                            Logger::write_log(LogEntry {
                                level: "ERROR".to_string(),
                                message: format!("注册快捷键失败: {}", e),
                                timestamp: String::new(),
                                details: None,
                            })
                            .unwrap_or_else(|_| {});
                            false
                        }
                    }
                }
            } else {
                // 禁用快捷键，取消注册
                match self.unregister_hotkeys(app_handle) {
                    Ok(_) => {
                        *self.enabled.write() = false;
                        false
                    }
                    Err(_) => false,
                }
            }
        } else {
            // 无法获取 app_handle
            false
        };

        result
    }

    // 根据配置注册快捷键
    fn register_configured_hotkeys(
        &self,
        app: &AppHandle,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let hotkeys = self.hotkeys.read();

        // 如果没有配置快捷键，不进行注册
        if hotkeys.is_empty() {
            return Ok(());
        }

        // 注册所有配置的快捷键
        for (_, shortcut) in hotkeys.iter() {
            match app.global_shortcut().register(shortcut.as_str()) {
                Ok(_) => {}
                Err(e) => {
                    return Err(Box::new(e));
                }
            }
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

    // 获取快捷键动作
    pub fn get_action_by_shortcut(&self, shortcut: &str) -> Option<String> {
        let formatted_shortcut = self.normalize_shortcut(shortcut);

        let shortcut_map = self.shortcut_to_action.read();
        shortcut_map.get(&formatted_shortcut).cloned()
    }

    // 标准化快捷键格式
    fn normalize_shortcut(&self, shortcut: &str) -> String {
        let mut result = shortcut.to_lowercase().replace(" ", "");

        // 一次完成所有替换
        static REPLACEMENTS: &[(&str, &str)] = &[
            ("ctrl+", "control+"),
            ("cmd+", "command+"),
            ("opt+", "option+"),
            ("win+", "meta+"),
        ];

        for (from, to) in REPLACEMENTS {
            result = result.replace(from, to);
        }

        result
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

            // 获取快捷键字符串表示
            let shortcut_str = shortcut.to_string();

            // 检查是否是配置的自定义快捷键
            if let Some(action) = hotkey_manager.get_action_by_shortcut(&shortcut_str) {
                match action.as_str() {
                    // 定义哪些窗口需要后端处理
                    "togglePanel" => {
                        // 打开/关闭主窗口
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

                    // 默认情况下，所有其他动作都通知前端处理
                    _ => {
                        let _ = app.emit("hotkey-triggered", &action);
                    }
                }
            }
        })
        .build()
}
