import { invoke } from "@tauri-apps/api/core";

/** 创建新窗口
 * @param state 窗口状态
 * @param windowId 窗口唯一标识符
 * @param title 窗口标题
 * @param url 窗口路径
 * @param size 窗口大小
 */
export const ipcCreateNewWindow = (
  state: boolean,
  windowId: string,
  title: string,
  url: string,
  size: [number, number],
) => {
  if (state) {
    state = false;
    invoke("close_new_window", { windowId }).catch((err: string) => {
      if (err === windowId) {
        invoke("create_new_window", { windowId, title, url, size });
      }
    });
  } else {
    state = true;
    invoke("create_new_window", { windowId, title, url, size });
  }
};

export const ipcStartClipboardListener = async () => {
  invoke("start_clipboard_listener");
};
export const ipcStopClipboardListener = async () => {
  invoke("stop_clipboard_listener");
};

/** 设置窗口置顶
 * @param windowId 窗口唯一标识符
 * @param isAlwaysOnTop 窗口是否置顶
 */
export const ipcSetWindowAlwaysOnTop = async (
  windowId: string,
  isAlwaysOnTop: boolean,
) => {
  invoke("set_window_always_on_top", { windowId, isAlwaysOnTop });
};

export const ipcGetConfig = async (keys: Array<string>) => {
  return invoke("get_config", { keys });
};
export const ipcSetConfig = async (keys: Array<string>, value: any) => {
  return invoke("set_config", { keys, value });
};

export const ipcDeleteConfig = async (keys: Array<string>) => {
  return invoke("delete_config", { keys });
};
/** 打开网页或应用 */
export const ipcOpen = (path: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      invoke("open_web_or_app", { path })
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  };