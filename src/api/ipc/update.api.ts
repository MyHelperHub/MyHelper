import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { showMessage } from "@/composables/message.ts";
import { UpdateProgress, UpdateResult } from "@/interface/update";
import { ErrorHandler } from "@/utils/errorHandler";

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
    ErrorHandler.handleError(error, "检查更新失败");
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
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          const percent = Math.round((downloaded / contentLength) * 100);

          if (onProgress) {
            onProgress({
              downloaded,
              total: contentLength,
              percent,
            });
          }
          break;
        case "Finished":
          break;
      }
    });

    showMessage("更新已完成，即将重启应用...", 2000, 1);

    // 延迟 2 秒后重启应用
    setTimeout(async () => {
      try {
        await relaunch();
      } catch (error) {
        ErrorHandler.handleError(error, "重启应用失败");
        showMessage("重启应用失败，请手动重启", 2500, 2);
      }
    }, 2000);
  } catch (error) {
    ErrorHandler.handleError(error, "更新安装失败");
    showMessage("更新安装失败，请重试", 2500, 2);
    throw error;
  }
}
export type { UpdateProgress };
