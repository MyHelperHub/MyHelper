import { ipcWindowControl, ipcCreateNewWindow } from "@/api/ipc/window.api";
import { WindowOperation } from "@/interface/enum";
import { WindowConfig } from "@/interface/window";
import { Ref } from "vue";

/**
 * 统一的窗口控制函数
 * @param config 窗口配置
 * @param isOpen 窗口状态引用
 */
export const handleWindowToggle = async (
  config: WindowConfig,
  isOpen: Ref<boolean>,
) => {
  try {
    if (isOpen.value) {
      // 如果窗口已打开，尝试关闭
      try {
        await ipcWindowControl(WindowOperation.Close, { window_id: config.windowId });
        isOpen.value = false;
      } catch (err) {
        // 如果关闭失败，说明窗口可能已经不存在
        // 这种情况下重置状态并创建新窗口
        isOpen.value = false;
        const res = await ipcCreateNewWindow(config);
        isOpen.value = res !== 0;
      }
    } else {
      // 如果窗口未打开，创建新窗口
      const res = await ipcCreateNewWindow(config);
      isOpen.value = res !== 0;
    }
  } catch (error) {
    // 确保状态与实际窗口状态同步
    isOpen.value = false;
  }
};
