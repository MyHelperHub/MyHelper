import { HotkeyItem, HotkeyConfig } from "../types/setting.ts";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Logger } from "../utils/logger.ts";
import { ipcSetHotkeyEnabled } from "@/api/ipc/hotkey.api.ts";
import { emit } from "../utils/eventBus.ts";
import {
  isMainMenuVisible,
  handleMainWindowToggle,
} from "../utils/windowManager.ts";
import { ErrorHandler } from "@/utils/errorHandler.ts";

/** 快捷键常量 */
export const HotkeyActions = {
  TOGGLE_PANEL: "togglePanel",
  TOGGLE_WEB_LIST: "toggleWebList",
  TOGGLE_APP_LIST: "toggleAppList",
  TOGGLE_QUICK_INPUT: "toggleQuickInput",
} as const;

export type HotkeyActionType =
  (typeof HotkeyActions)[keyof typeof HotkeyActions];

/** 快捷键配置定义，包含ID、标题和默认键 */
export type HotkeyDefinition = {
  id: HotkeyActionType;
  title: string;
  defaultKey: string;
};

/** 统一的快捷键配置表 */
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

/** 获取所有快捷键定义的映射表 */
export const getHotkeyItemsMap = () => {
  const map: Record<string, { title: string }> = {};
  HOTKEY_DEFINITIONS.forEach((def) => {
    map[def.id] = { title: def.title };
  });
  return map;
};

/** 获取默认快捷键配置 */
export const getDefaultHotkeyConfig = (): HotkeyConfig => {
  const config: Record<string, HotkeyItem> = {};
  HOTKEY_DEFINITIONS.forEach((def) => {
    config[def.id] = {
      enabled: true,
      key: def.defaultKey,
    };
  });
  return {
    enabled: false,
    ...config,
  } as HotkeyConfig;
};

/** 规范化快捷键配置 */
export const normalizeHotkeyConfig = (
  config?: Partial<HotkeyConfig> | null,
): HotkeyConfig => {
  const defaults = getDefaultHotkeyConfig();

  const normalized = {
    ...defaults,
    ...(config ?? {}),
    enabled: config?.enabled ?? defaults.enabled,
  } as HotkeyConfig;

  for (const { id } of HOTKEY_DEFINITIONS) {
    const defaultItem = defaults[id];
    const incomingItem = (config as Partial<HotkeyConfig> | null | undefined)?.[
      id
    ] as HotkeyItem | undefined;

    normalized[id] = {
      ...defaultItem,
      ...(incomingItem ?? {}),
    } as HotkeyItem;

    if (typeof normalized[id].enabled !== "boolean") {
      normalized[id].enabled = defaultItem.enabled;
    }

    const keyValue = (normalized[id] as Record<string, unknown>).key;
    if (typeof keyValue !== "string" || keyValue.trim() === "") {
      (normalized[id] as Record<string, unknown>).key = (
        defaultItem as Record<string, unknown>
      ).key;
    }
  }

  return normalized;
};

/** 监听器的引用 */
let hotkeyUnlistener: UnlistenFn | null = null;

/**
 * 确保主窗口处于展开状态
 * 如果当前是小窗模式，先展开为大窗模式
 */
const ensureMainWindowExpanded = async () => {
  if (!isMainMenuVisible.value) {
    await handleMainWindowToggle();
    // 等待窗口展开动画完成
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
};
/**
 * 处理快捷键动作
 */
const handleHotkeyAction = async (action: string) => {
  switch (action) {
    case HotkeyActions.TOGGLE_PANEL:
      await handleMainWindowToggle();
      break;
    case HotkeyActions.TOGGLE_WEB_LIST:
      await ensureMainWindowExpanded();
      emit("hotkey-open-commonWeb");
      break;
    case HotkeyActions.TOGGLE_APP_LIST:
      await ensureMainWindowExpanded();
      emit("hotkey-open-commonApp");
      break;
    case HotkeyActions.TOGGLE_QUICK_INPUT:
      await ensureMainWindowExpanded();
      emit("hotkey-open-quickInput");
      break;
    default:
      Logger.warn("未知的快捷键动作:", action);
  }
};

/**
 * 初始化快捷键监听器
 */
const initHotkeyListener = async (): Promise<void> => {
  try {
    if (hotkeyUnlistener) {
      await hotkeyUnlistener();
      hotkeyUnlistener = null;
    }

    hotkeyUnlistener = await listen(
      "hotkey-triggered",
      (event: { payload: string }) => {
        const action = event.payload;
        handleHotkeyAction(action);
      },
    );
    console.log("快捷键监听器初始化成功");
  } catch (error) {
    ErrorHandler.handleError(error, "初始化快捷键监听器失败:");
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
  const normalizedConfig = normalizeHotkeyConfig(config);

  try {
    await ipcSetHotkeyEnabled(normalizedConfig);

    if (normalizedConfig.enabled) {
      await initHotkeyListener();
    } else {
      await cleanupHotkeyListener();
    }

    return true;
  } catch (error) {
    ErrorHandler.handleError(error, "设置热键状态失败:");
    return false;
  }
};
