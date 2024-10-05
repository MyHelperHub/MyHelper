import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';

// 启动剪切板监听
export async function startClipboardListening() {

    // 监听剪贴板更新事件
    listen('clipboard-updated', event => {
        const clipboardContent = event.payload;
        console.log('Clipboard updated:', clipboardContent);
        // 在这里可以处理剪贴板内容，比如更新UI
    });
    await invoke('start_clipboard_listener');
}

// 停止剪切板监听
export async function stopClipboardListening() {
    await invoke('stop_clipboard_listener');
}
