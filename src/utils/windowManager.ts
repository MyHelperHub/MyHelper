import {
  ipcWindowControl,
  ipcCreateNewWindow,
  ipcSetWindowSize,
} from "@/api/ipc/window.api";
import { WindowOperation } from "@/types/enum";
import { WindowConfig } from "@/types/window";
import { Ref, ref } from "vue";
import { delay } from "@/utils/common";
import { hideMessage } from "@/composables/message.ts";

/** 全局主窗口菜单展开状态 */
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
      try {
        await ipcWindowControl(WindowOperation.Close, {
          window_id: config.windowId,
        });
        isOpen.value = false;
      } catch (err) {
        isOpen.value = false;
        const res = await ipcCreateNewWindow(config);
        isOpen.value = Boolean(res);
      }
    } else {
      const res = await ipcCreateNewWindow(config);
      isOpen.value = Boolean(res);
    }
  } catch (error) {
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
