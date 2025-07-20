import { HotkeyConfig } from "../interface/database";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Logger } from "../utils/logger.ts";
import { ipcSetHotkeyEnabled } from "@/api/ipc/hotkey.api.ts";
import { emit } from "../utils/eventBus.ts";
import { isMainMenuVisible, handleMainWindowToggle } from "../utils/windowManager.ts";

// 快捷键常量
export const HotkeyActions = {
  TOGGLE_PANEL: "togglePanel",
  TOGGLE_WEB_LIST: "toggleWebList",
  TOGGLE_APP_LIST: "toggleAppList",
  TOGGLE_QUICK_INPUT: "toggleQuickInput",
  // TOGGLE_PROXY: "toggleProxy",
} as const;

export type HotkeyActionType =
  (typeof HotkeyActions)[keyof typeof HotkeyActions];

// 快捷键配置定义，包含ID、标题和默认键
export interface HotkeyDefinition {
  id: HotkeyActionType;
  title: string;
  defaultKey: string;
}

// 统一的快捷键配置表
export const HOTKEY_DEFINITIONS: HotkeyDefinition[] = [
  {
    id: HotkeyActions.TOGGLE_PANEL,
    title: "打开/关闭主窗口",
    defaultKey: "control+F1",
  },
  {
    id: HotkeyActions.TOGGLE_WEB_LIST,
    title: "打开网站列表弹窗",
    defaultKey: "control+F2",
  },
  {
    id: HotkeyActions.TOGGLE_APP_LIST,
    title: "打开软件列表弹窗",
    defaultKey: "control+F3",
  },
  {
    id: HotkeyActions.TOGGLE_QUICK_INPUT,
    title: "打开快捷输入弹窗",
    defaultKey: "control+F4",
  },
  // {
  //   id: HotkeyActions.TOGGLE_PROXY,
  //   title: "打开/关闭系统代理",
  //   defaultKey: "control+delete",
  // },
];

// 获取所有快捷键定义的映射表
export const getHotkeyItemsMap = () => {
  const map: Record<string, { title: string }> = {};
  HOTKEY_DEFINITIONS.forEach((def) => {
    map[def.id] = { title: def.title };
  });
  return map;
};

// 获取默认快捷键配置
export const getDefaultHotkeyConfig = () => {
  const config: Record<string, HotkeyConfig> = {};
  HOTKEY_DEFINITIONS.forEach((def) => {
    config[def.id] = {
      enabled: true,
      key: def.defaultKey,
    };
  });
  return {
    enabled: false,
    ...config,
  };
};

// 监听器的引用
let hotkeyUnlistener: UnlistenFn | null = null;

/**
 * 确保主窗口处于展开状态
 * 如果当前是小窗模式，先展开为大窗模式
 */
const ensureMainWindowExpanded = async () => {
  if (!isMainMenuVisible.value) {
    console.log("当前是小窗模式，先展开主窗口");
    await handleMainWindowToggle();
    // 等待窗口展开动画完成
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
};

/**
 * 处理快捷键动作
 */
const handleHotkeyAction = async (action: string) => {
  // 根据动作类型执行相应操作
  switch (action) {
    case HotkeyActions.TOGGLE_PANEL:
      console.log("触发打开/关闭主窗口快捷键");
      await handleMainWindowToggle();
      break;
    case HotkeyActions.TOGGLE_WEB_LIST:
      console.log("触发打开网站列表弹窗快捷键");
      // 先确保主窗口展开，再打开弹窗
      await ensureMainWindowExpanded();
      emit("hotkey-open-commonWeb");
      break;
    case HotkeyActions.TOGGLE_APP_LIST:
      console.log("触发打开软件列表弹窗快捷键");
      // 先确保主窗口展开，再打开弹窗
      await ensureMainWindowExpanded();
      emit("hotkey-open-commonApp");
      break;
    case HotkeyActions.TOGGLE_QUICK_INPUT:
      console.log("触发打开快捷输入弹窗快捷键");
      // 先确保主窗口展开，再打开弹窗
      await ensureMainWindowExpanded();
      emit("hotkey-open-quickInput");
      break;
    // case HotkeyActions.TOGGLE_PROXY:
    //   console.log("触发打开/关闭系统代理快捷键");
    //   // 实际功能在此处理
    //   break;
    default:
      Logger.warn("未知的快捷键动作:", action);
  }
};

/**
 * 初始化快捷键监听器
 */
const initHotkeyListener = async (): Promise<void> => {
  try {
    // 如果已经有监听器，先取消它
    if (hotkeyUnlistener) {
      await hotkeyUnlistener();
      hotkeyUnlistener = null;
    }

    // 监听来自后端的快捷键事件
    hotkeyUnlistener = await listen(
      "hotkey-triggered",
      (event: { payload: string }) => {
        const action = event.payload;
        handleHotkeyAction(action);
      },
    );
    console.log("快捷键监听器初始化成功");
  } catch (error) {
    Logger.error("初始化快捷键监听器失败:", error);
  }
};

/**
 * 清理热键监听器
 */
const cleanupHotkeyListener = async (): Promise<void> => {
  if (hotkeyUnlistener) {
    await hotkeyUnlistener();
    hotkeyUnlistener = null;
  }
};

/**
 * 设置热键启用状态
 * @param config 热键配置
 * @returns 设置是否成功
 */
export const setHotkeyEnabled = async (
  config: HotkeyConfig,
): Promise<boolean> => {
  try {
    // 设置后端热键状态
    await ipcSetHotkeyEnabled(config);

    if (config.enabled) {
      await initHotkeyListener();
    } else {
      // 如果禁用热键，清理现有的监听器
      await cleanupHotkeyListener();
    }

    return true;
  } catch (error) {
    console.error("设置热键状态失败:", error);
    Logger.error("设置热键状态失败:", error);
    return false;
  }
};
