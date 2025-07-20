import { ipcWindowControl, ipcCreateNewWindow, ipcSetWindowSize } from "@/api/ipc/window.api";
import { WindowOperation } from "@/interface/enum";
import { WindowConfig } from "@/interface/window";
import { Ref, ref } from "vue";
import { delay } from "@/utils/common";
import { hideMessage } from "@/composables/message.ts";

// 全局主窗口菜单展开状态
export const isMainMenuVisible = ref(false);

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
        await ipcWindowControl(WindowOperation.Close, {
          window_id: config.windowId,
        });
        isOpen.value = false;
      } catch (err) {
        // 如果关闭失败，说明窗口可能已经不存在
        // 这种情况下重置状态并创建新窗口
        isOpen.value = false;
        const res = await ipcCreateNewWindow(config);
        isOpen.value = Boolean(res);
      }
    } else {
      // 如果窗口未打开，创建新窗口
      const res = await ipcCreateNewWindow(config);
      isOpen.value = Boolean(res);
    }
  } catch (error) {
    // 确保状态与实际窗口状态同步
    isOpen.value = false;
  }
};

/**
 * 主窗口菜单展开/收起控制函数
 * 使用全局状态管理主窗口的展开/收起状态
 */
export const handleMainWindowToggle = async () => {
  hideMessage();

  let width: number;
  let height: number;

  if (isMainMenuVisible.value) {
    width = 65;
    height = 65;
    isMainMenuVisible.value = false;
    // 等待动画完成后再调整窗口大小
    await delay(220).then(() => {
      ipcSetWindowSize(width, height);
    });
  } else {
    width = 250;
    height = 420;
    ipcSetWindowSize(width, height);
    isMainMenuVisible.value = true;
  }
};
