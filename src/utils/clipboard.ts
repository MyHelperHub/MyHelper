import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { ref } from "vue";
import { QuickInputItem } from "@/interface/quickInput";
import {
  ipcStartClipboardListener,
  ipcStopClipboardListener,
} from "@/api/ipc/clipboard.api";
import { showMessage } from "./message";

// 响应式的剪贴板数据引用
export const clipboardData = ref<QuickInputItem[]>([]);

let clipboardListener: UnlistenFn | null = null;

/** 启动剪贴板监听 */
export async function startClipboardListening() {
  if (clipboardListener) {
    clipboardListener();
  }

  clipboardListener = await listen("clipboard-updated", (event) => {
    const clipboardContent = event.payload as string;

    // 只处理不同于当前第一条的内容
    if (
      !clipboardData.value.length ||
      (clipboardData.value[0].text !== clipboardContent &&
        clipboardData.value[0].text !== "")
    ) {
      clipboardData.value.unshift({
        id: Date.now(),
        text: clipboardContent,
      });

      // 限制数据条数，超过 50 条时删除最早的记录
      if (clipboardData.value.length > 50) {
        clipboardData.value.pop();
      }
    }
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
