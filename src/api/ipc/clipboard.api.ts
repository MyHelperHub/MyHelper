import { invoke } from "@tauri-apps/api/core";

/**
 * 启动剪贴板监听器
 * 实时监听剪贴板内容的变化
 */
export const ipcStartClipboardListener = async () => {
  invoke("start_clipboard_listener");
};

/**
 * 停止剪贴板监听器
 * 停止监听剪贴板内容的变化
 */
export const ipcStopClipboardListener = async () => {
  invoke("stop_clipboard_listener");
};

/**
 * 将文本内容写入剪贴板
 * @param text 要写入剪贴板的文本内容
 */
export const ipcWriteClipboard = async (text: string) => {
  return invoke("write_clipboard", { text });
};

/**
 * 从剪贴板中粘贴内容
 * 返回当前剪贴板中的内容
 */
export const ipcPaste = async () => {
  return invoke("paste");
};
