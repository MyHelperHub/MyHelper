import { invokeApi } from "./wrapper";

/**
 * 打开指定的网页或应用
 * @param path 要打开的网页或应用路径
 * @returns 返回一个 Promise，在操作完成时解析或拒绝
 */
export const ipcOpen = async (path: string): Promise<void> => {
  return await invokeApi("open_web_or_app", { path });
};

/**
 * 获取应用程序的图标
 * @param exePath 应用程序的可执行文件路径
 * @returns 返回图标的二进制数据
 */
export const ipcGetAppIcon = async (exePath: string) => {
  return await invokeApi("get_app_icon", { exePath });
};

/**
 * 获取网页的图标
 * @param url 要获取图标的网页 URL
 * @returns 返回图标的二进制数据
 */
export const ipcGetWebIcon = async (url: string) => {
  return await invokeApi("get_web_icon", { url });
};

/**
 * 设置本地文件为图标
 * @param imagePath 图标文件的本地路径
 * @param appType 应用类型，0 为网页图标，1 为应用图标
 */
export const ipcSetLocalIcon = async (imagePath: string, appType: number) => {
  return await invokeApi("set_local_icon", { imagePath, appType });
};

/**
 * 删除图标
 * @param filename 文件名
 * @param app_type 应用类型，0 为网页图标，1 为应用图标
 * @returns
 */
export const ipcDeleteIcon = async (filename: string, appType: number) => {
  return await invokeApi("delete_icon", { filename, appType });
};

/**
 * 设置本地文件为图标
 * @param imageBase64 图标路径
 */
export const ipcSetLogo = async (imageBase64: string) => {
  return await invokeApi("set_logo", { imageBase64 });
};

/**
 * 判断文件是否存在
 * @param path 路径
 * @returns
 */
export const ipcFileExists = async (path: string) => {
  return await invokeApi("file_exists", { path });
};
