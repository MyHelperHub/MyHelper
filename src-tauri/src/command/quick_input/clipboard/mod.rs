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

use clipboard_rs::{
    Clipboard, ClipboardContext, ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext,
    ContentFormat, WatcherShutdown,
};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::async_runtime;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use crate::utils::error::{AppError, AppResult};

static CLIPBOARD_LISTENER: AtomicBool = AtomicBool::new(false); // 控制监听状态
static mut WATCHER_SHUTDOWN: Option<WatcherShutdown> = None; // 存储关闭信号

/// 剪贴板管理器
/// 
/// 负责处理剪贴板事件和内容更新
struct Manager {
    ctx: ClipboardContext,
    sender: mpsc::Sender<String>, // 发送器
    app_handle: AppHandle,        // 保存 AppHandle
}

impl Manager {
    /// 创建新的剪贴板管理器实例
    pub fn new(sender: mpsc::Sender<String>, app_handle: AppHandle) -> Self {
        let ctx = ClipboardContext::new().unwrap();
        Manager {
            ctx,
            sender,
            app_handle,
        }
    }

    /// 处理剪贴板文本内容
    fn handle_text(&self) {
        // 如果监听已经停止，不处理剪贴板事件
        if !CLIPBOARD_LISTENER.load(Ordering::SeqCst) {
            return;
        }
        if let Ok(text) = self.ctx.get_text() {
            let _ = self.sender.try_send(text.clone());

            let app_handle = self.app_handle.clone();
            async_runtime::spawn(async move {
                if let Err(e) = app_handle.emit("clipboard-updated", text) {
                    eprintln!("Failed to emit event: {}", e);
                }
            });
        }
    }
}

impl ClipboardHandler for Manager {
    fn on_clipboard_change(&mut self) {
        if self.ctx.has(ContentFormat::Text) {
            self.handle_text();
            println!("{}", self.ctx.get_text().unwrap());
            let _ = self
                .app_handle
                .emit("clipboard-updated", self.ctx.get_text().unwrap());
        } else {
            println!("Clipboard does not contain text format.");
        }
    }
}

/// 启动剪贴板监听
/// 
/// 开始监听系统剪贴板的变化，当内容更新时触发事件
#[tauri::command]
pub async fn start_clipboard_listener(app_handle: AppHandle) -> AppResult<()> {
    if CLIPBOARD_LISTENER.load(Ordering::SeqCst) {
        return Ok(());
    }

    CLIPBOARD_LISTENER.store(true, Ordering::SeqCst);

    let (tx, _rx) = mpsc::channel::<String>(10);
    let manager = Manager::new(tx.clone(), app_handle.clone());
    let mut watcher = ClipboardWatcherContext::new()
        .map_err(|e| AppError::Error(format!("Failed to create clipboard watcher: {}", e)))?;

    let watcher_shutdown = watcher.add_handler(manager).get_shutdown_channel();
    unsafe {
        WATCHER_SHUTDOWN = Some(watcher_shutdown);
    }

    watcher.start_watch();
    Ok(())
}

/// 停止剪贴板监听
/// 
/// 停止监听系统剪贴板的变化
#[tauri::command]
pub async fn stop_clipboard_listener() -> AppResult<()> {
    if CLIPBOARD_LISTENER.load(Ordering::SeqCst) {
        unsafe {
            if let Some(shutdown) = WATCHER_SHUTDOWN.take() {
                shutdown.stop();
            }
        }
        CLIPBOARD_LISTENER.store(false, Ordering::SeqCst);
    }
    Ok(())
}

/// 写入内容到剪贴板
/// 
/// # Arguments
/// 
/// * `text` - 要写入剪贴板的文本内容
#[tauri::command]
pub async fn write_clipboard(text: String) -> AppResult<()> {
    let ctx = ClipboardContext::new()
        .map_err(|e| AppError::Error(format!("Failed to create clipboard context: {}", e)))?;
    
    ctx.set_text(text)
        .map_err(|e| AppError::Error(format!("Failed to set clipboard content: {}", e)))?;
    
    Ok(())
}

