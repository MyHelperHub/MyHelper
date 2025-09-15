import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { ref } from "vue";
import { QuickInputItem } from "@/interface/quickInput";
import {
  ipcStartClipboardListener,
  ipcStopClipboardListener,
} from "@/api/ipc/clipboard.api.ts";
import { showMessage } from "./message.ts";

/** 响应式的剪贴板数据引用 */
export const clipboardData = ref<QuickInputItem[]>([]);

/** 剪贴板监听器引用 */
let clipboardListener: UnlistenFn | null = null;

/** 启动剪贴板监听 */
export async function startClipboardListening() {
  if (clipboardListener) {
    clipboardListener();
  }

  clipboardListener = await listen("clipboard-updated", (event) => {
    const payload = event.payload as string | undefined;
    const text = typeof payload === "string" ? payload : String(payload ?? "");

    // 跳过空内容，避免阻塞后续有效内容被记录
    if (text.trim().length === 0) return;

    // 以不可变方式更新
    clipboardData.value = [
      { id: Date.now(), text },
      ...clipboardData.value,
    ].slice(0, 50);
  });

  await ipcStartClipboardListener();
}

/** 停止剪贴板监听 */
export async function stopClipboardListening() {
  if (clipboardListener) {
    clipboardListener();
    clipboardListener = null;
  }

  await ipcStopClipboardListener();
}

/** 复制到剪贴板 */
export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  showMessage("已复制到剪贴板", 2500, 1);
}

/** 从剪贴板历史中删除指定项目 */
export function removeClipboardItem(id: number) {
  const index = clipboardData.value.findIndex((item) => item.id === id);
  if (index !== -1) {
    clipboardData.value.splice(index, 1);
    showMessage("已删除", 2000, 1);
  }
}
