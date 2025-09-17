#[cfg(target_os = "macos")]
mod mac;

#[cfg(target_os = "windows")]
mod win;

#[cfg(target_os = "linux")]
mod linux;

#[cfg(target_os = "macos")]
pub use mac::*;

#[cfg(target_os = "windows")]
pub use win::*;

#[cfg(target_os = "linux")]
pub use linux::*;

use crate::utils::error::AppError;
use crate::utils::response::{ApiResponse, ApiStatusCode};
use clipboard_rs::{
    Clipboard, ClipboardContext, ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext,
    ContentFormat, WatcherShutdown,
};
use once_cell::sync::OnceCell;
use parking_lot::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, Emitter};

// 使用OnceCell初始化静态资源，提高性能和线程安全性
static CLIPBOARD_LISTENER: AtomicBool = AtomicBool::new(false); // 控制监听状态
static WATCHER_SHUTDOWN: OnceCell<Mutex<Option<WatcherShutdown>>> = OnceCell::new(); // 存储关闭信号

// 添加一个全局标志位来标记是否是内部操作触发的剪贴板变化
static INTERNAL_CLIPBOARD_OPERATION: AtomicBool = AtomicBool::new(false);

fn get_watcher_shutdown() -> &'static Mutex<Option<WatcherShutdown>> {
    WATCHER_SHUTDOWN.get_or_init(|| Mutex::new(None))
}

/// 剪贴板管理器
///
/// 负责处理剪贴板事件和内容更新
struct Manager {
    ctx: ClipboardContext,
    app_handle: AppHandle,        // 保存 AppHandle
    last_text: Option<String>,    // 上一次文本，用于去重
}

impl Manager {
    /// 创建新的剪贴板管理器实例
    pub fn new(app_handle: AppHandle) -> Self {
        let ctx = ClipboardContext::new().unwrap();
        Manager { ctx, app_handle, last_text: None }
    }

    /// 处理剪贴板文本内容
    fn handle_text(&mut self, text: String) {
        // 如果监听已经停止，不处理剪贴板事件
        if !CLIPBOARD_LISTENER.load(Ordering::Relaxed) {
            return;
        }

        if self
            .last_text
            .as_ref()
            .map(|s| s.as_str() == text.as_str())
            .unwrap_or(false)
        {
            return;
        }
        self.last_text = Some(text.clone());

        if let Err(e) = self.app_handle.emit("clipboard-updated", text) {
            let app_error = AppError::from(format!("事件发送失败: {}", e));
            eprintln!("{}", app_error);
        }
    }
}

impl ClipboardHandler for Manager {
    fn on_clipboard_change(&mut self) {
        // 检查是否是内部操作触发的剪贴板变化
        if INTERNAL_CLIPBOARD_OPERATION.load(Ordering::Acquire) {
            INTERNAL_CLIPBOARD_OPERATION.store(false, Ordering::Release);
            return;
        }

        if self.ctx.has(ContentFormat::Text) {
            // 只获取一次剪贴板内容
            if let Ok(text) = self.ctx.get_text() {
                self.handle_text(text);
            }
        } else {
            // 非文本内容忽略
        }
    }
}

/// 启动剪贴板监听
///
/// 开始监听系统剪贴板的变化，当内容更新时触发事件
#[tauri::command]
pub async fn start_clipboard_listener() -> Result<ApiResponse<()>, AppError> {
    if CLIPBOARD_LISTENER.load(Ordering::SeqCst) {
        return Ok(ApiResponse::success(()));
    }

    let app_handle = match crate::core::app_handle::AppHandleManager::clone() {
        Some(handle) => handle,
        None => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrSystem,
                "获取AppHandle失败",
            ))
        }
    };

    CLIPBOARD_LISTENER.store(true, Ordering::SeqCst);

    let manager = Manager::new(app_handle.clone());
    let mut watcher = match ClipboardWatcherContext::new() {
        Ok(w) => w,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrSystem,
                format!("创建剪贴板监听程序失败： {}", e),
            ))
        }
    };

    let watcher_shutdown = watcher.add_handler(manager).get_shutdown_channel();
    *get_watcher_shutdown().lock() = Some(watcher_shutdown);

    watcher.start_watch();
    Ok(ApiResponse::success(()))
}

/// 停止剪贴板监听
///
/// 停止监听系统剪贴板的变化
#[tauri::command]
pub async fn stop_clipboard_listener() -> Result<ApiResponse<()>, AppError> {
    if CLIPBOARD_LISTENER.load(Ordering::SeqCst) {
        let mut shutdown_lock = get_watcher_shutdown().lock();
        if let Some(shutdown) = shutdown_lock.take() {
            shutdown.stop();
        }
        CLIPBOARD_LISTENER.store(false, Ordering::SeqCst);
    }
    Ok(ApiResponse::success(()))
}

/// 写入内容到剪贴板
///
/// # Arguments
///
/// * `text` - 要写入剪贴板的文本内容
#[tauri::command]
pub async fn write_clipboard(text: String) -> Result<ApiResponse<()>, AppError> {
    // 设置标志位，标记这是内部操作
    INTERNAL_CLIPBOARD_OPERATION.store(true, Ordering::Release);

    let ctx = match ClipboardContext::new() {
        Ok(c) => c,
        Err(e) => {
            return Ok(ApiResponse::error(
                ApiStatusCode::ErrSystem,
                format!("Failed to create clipboard context: {}", e),
            ))
        }
    };

    match ctx.set_text(text) {
        Ok(_) => Ok(ApiResponse::success(())),
        Err(e) => Ok(ApiResponse::error(
            ApiStatusCode::ErrSystem,
            format!("Failed to set clipboard content: {}", e),
        )),
    }
}
