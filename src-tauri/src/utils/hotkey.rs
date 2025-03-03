use tauri::{Emitter, Runtime};
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

/// 创建全局快捷键插件
pub fn init<R: Runtime>() -> impl tauri::plugin::Plugin<R> {
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            // 检查是否是 Ctrl+\ 快捷键
            if shortcut.matches(Modifiers::CONTROL, Code::Backslash)
                && event.state() == ShortcutState::Pressed
            {
                // 只在按下时触发事件
                println!("快捷键触发: Ctrl+\\");
                let _ = app.emit("hotkey-triggered", "console_log");
            }
        })
        .with_shortcuts(["ctrl+\\"])
        .expect("无法注册快捷键")
        .build()
}
