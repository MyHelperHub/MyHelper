import { invoke } from "@tauri-apps/api/core";

/**
 * 打开指定的网页或应用
 * @param path 要打开的网页或应用路径
 * @returns 返回一个 Promise，在操作完成时解析或拒绝
 */
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
/**
 * 获取应用程序的图标
 * @param exePath 应用程序的可执行文件路径
 * @returns 返回图标的二进制数据
 */
export const ipcGetAppIcon = async (exePath: string) => {
  return invoke("get_app_icon", { exePath });
};

/**
 * 获取网页的图标
 * @param url 要获取图标的网页 URL
 * @returns 返回图标的二进制数据
 */
export const ipcGetWebIcon = async (url: string) => {
  return invoke("get_web_icon", { url });
};

/**
 * 设置本地文件或 base64 编码的图像为图标
 * @param appType 应用类型，0为网页图标，1为应用图标，2为 logo 图片
 * @param imagePath 图标文件的本地路径（可选）
 * @param imageBase64 图标的 base64 编码（可选）
 */
export const ipcSetLocalIcon = async (
  appType: number,
  imagePath?: string | null,
  imageBase64?: string | null,
) => {
  return invoke("set_local_icon", {
    appType: appType,
    imagePath: imagePath || null,
    imageBase64: imageBase64 || null,
  });
};
