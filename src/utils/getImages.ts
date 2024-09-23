import { invoke } from "@tauri-apps/api/core";

/** vite加载图片 */
export const getImageByPath = (imagePath: string): string => {
  return new URL(imagePath, import.meta.url).href;
};

/** 根据tauri从本地绝对路径获取图片
 * @param path 本地绝对路径
 * @returns base64
 */
export const getImageByTauri = async (path: string): Promise<string> => {
  try {
    const res = await invoke("get_image_base64", { path: path });
    // 直接返回 Base64 数据，前面加上数据类型和编码信息
    return `data:image/png;base64,${res as string}`;
  } catch (error) {
    throw error;
  }
};
