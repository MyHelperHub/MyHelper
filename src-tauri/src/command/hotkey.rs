use crate::{
    core::hotkey::HotkeyManager,
    utils::{error::AppError, response::ApiResponse},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// 定义快捷键配置的结构
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HotkeyItem {
    pub enabled: bool,
    pub key: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct HotkeyConfig {
    pub enabled: bool,
    #[serde(flatten)]
    pub items: HashMap<String, HotkeyItem>,
}

#[tauri::command]
pub fn set_hotkey_enabled(config: HotkeyConfig) -> Result<ApiResponse<()>, AppError> {
    // 总开关关闭时直接禁用所有快捷键
    if !config.enabled {
        HotkeyManager::global().set_enabled(false);
        return Ok(ApiResponse::success(()));
    }

    // 总开关打开，根据各项配置设置快捷键
    let mut hotkeys = Vec::new();

    // 辅助函数：标准化快捷键格式
    fn normalize_hotkey(key: &str) -> String {
        let mut result = key.to_lowercase().replace(" ", "");

        // 处理常见的修饰键别名
        result = result.replace("ctrl+", "control+");
        result = result.replace("cmd+", "command+");
        result = result.replace("opt+", "option+");
        result = result.replace("win+", "meta+");

        result
    }

    // 统一处理所有快捷键项
    for (name, item) in config.items.iter() {
        if item.enabled && !item.key.is_empty() {
            let normalized_key = normalize_hotkey(&item.key);
            hotkeys.push((name.clone(), normalized_key.clone()));
        }
    }

    // 更新快捷键配置
    HotkeyManager::global().set_hotkeys(hotkeys);
    Ok(ApiResponse::success(()))
}
