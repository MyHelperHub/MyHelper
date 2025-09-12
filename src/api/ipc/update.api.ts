import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { showMessage } from "@/composables/message.ts";
import { UpdateProgress, UpdateResult } from "@/interface/update";

/** 检查应用更新 */
export async function ipcCheckForUpdates(): Promise<UpdateResult> {
  try {
    const update = await check();
    if (update) {
      return {
        shouldUpdate: true,
        version: update.version,
        notes: update.body,
        date: update.date,
      };
    }
    return {
      shouldUpdate: false,
    };
  } catch (error) {
    console.error("检查更新失败:", error);
    throw error;
  }
}

/** 下载并安装更新 */
export async function ipcDownloadAndInstallUpdate(
  onProgress?: (progress: UpdateProgress) => void,
): Promise<void> {
  try {
    const update = await check();
    if (!update) {
      throw new Error("No update available");
    }

    let downloaded = 0;
    let contentLength = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength as number;
          console.log(`开始下载，总大小: ${contentLength} 字节`);
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          const percent = Math.round((downloaded / contentLength) * 100);
          console.log(`已下载: ${downloaded} / ${contentLength} (${percent}%)`);

          if (onProgress) {
            onProgress({
              downloaded,
              total: contentLength,
              percent,
            });
          }
          break;
        case "Finished":
          console.log("下载完成");
          break;
      }
    });

    console.log("更新已安装完成");
    showMessage("更新已完成，即将重启应用...", 2000, 1);

    // 延迟 2 秒后重启应用
    setTimeout(async () => {
      try {
        await relaunch();
      } catch (error) {
        console.error("重启应用失败:", error);
        showMessage("重启应用失败，请手动重启", 2500, 2);
      }
    }, 2000);
  } catch (error) {
    console.error("更新安装失败:", error);
    showMessage("更新安装失败，请重试", 2500, 2);
    throw error;
  }
}
export type { UpdateProgress };
