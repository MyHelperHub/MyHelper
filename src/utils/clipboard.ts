import { UnlistenFn, listen } from "@tauri-apps/api/event";
import GlobalData from "./globalData";
import { ref } from "vue";
import { QuickInputItem } from "@/interface/quickInput";
import {
  ipcStartClipboardListener,
  ipcStopClipboardListener,
} from "@/api/ipc/clipboard.api";

let clipboardListener: UnlistenFn | null = null;
let clipboardData = ref<QuickInputItem[]>([]);
GlobalData.set("clipboardList", clipboardData);

/** 启动剪切板监听 */
export async function startClipboardListening() {
  // 如果已经有监听器，先移除
  if (clipboardListener) {
    clipboardListener();
  }

  // 监听剪贴板更新事件
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

/** 停止剪切板监听 */
export async function stopClipboardListening() {
  if (clipboardListener) {
    clipboardListener();
    clipboardListener = null;
  }

  await ipcStopClipboardListener();
}
