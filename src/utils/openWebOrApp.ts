import { invoke } from "@tauri-apps/api/core";

/** 打开网页或应用 */
export const open = (path: string): Promise<void> => {
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
