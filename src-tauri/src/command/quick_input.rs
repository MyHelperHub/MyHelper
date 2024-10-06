use clipboard_rs::{
    Clipboard, ClipboardContext, ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext, ContentFormat, WatcherShutdown
};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::async_runtime;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;

struct Manager {
    ctx: ClipboardContext,
    sender: mpsc::Sender<String>, // 发送器
    app_handle: AppHandle,        // 保存 AppHandle
}

impl Manager {
    pub fn new(sender: mpsc::Sender<String>, app_handle: AppHandle) -> Self {
        let ctx = ClipboardContext::new().unwrap();
        Manager {
            ctx,
            sender,
            app_handle,
        }
    }

    fn handle_text(&self) {
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

static CLIPBOARD_LISTENER: AtomicBool = AtomicBool::new(false); // 控制监听状态
static mut WATCHER_SHUTDOWN: Option<WatcherShutdown> = None; // 存储关闭信号

#[tauri::command]
pub async fn start_clipboard_listener(app_handle: AppHandle) -> Result<(), String> {
    if CLIPBOARD_LISTENER.load(Ordering::SeqCst) {
        return Ok(()); // 已在监听，直接返回
    }

    CLIPBOARD_LISTENER.store(true, Ordering::SeqCst); // 设置为监听状态

    let (tx, _rx) = mpsc::channel::<String>(10); // 发送剪贴板内容
    let manager = Manager::new(tx.clone(), app_handle.clone()); // 克隆 tx 以传递给 Manager
    let mut watcher = ClipboardWatcherContext::new().unwrap();

    let watcher_shutdown = watcher.add_handler(manager).get_shutdown_channel();
    unsafe {
        WATCHER_SHUTDOWN = Some(watcher_shutdown); // 存储关闭信号
    }

    watcher.start_watch(); // 启动监听

    Ok(())
}

#[tauri::command]
pub async fn stop_clipboard_listener() -> Result<(), String> {
    if CLIPBOARD_LISTENER.load(Ordering::SeqCst) {
        unsafe {
            if let Some(shutdown) = WATCHER_SHUTDOWN.take() {
                shutdown.stop(); // 停止监听
            }
        }
        CLIPBOARD_LISTENER.store(false, Ordering::SeqCst); // 更新状态为停止
    }
    Ok(())
}
