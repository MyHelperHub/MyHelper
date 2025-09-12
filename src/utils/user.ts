import { User } from "../interface/user";
import { getConfig, updateConfig } from "./config";
import { ipcFileExists } from "@/api/ipc/launch.api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";

/** 用户配置键名 */
const USER_CONFIG_KEY = "userConfig";

/**
 * 获取用户配置
 * @returns {Promise<User>} 返回用户配置
 */
export const getUserConfig = async (): Promise<User> => {
  try {
    const config = await getConfig<User>(USER_CONFIG_KEY);
    return (
      config || {
        Avatar: undefined,
        Email: "",
        Token: "",
        UserId: 0,
        Username: "",
      }
    );
  } catch (error) {
    console.error("获取用户配置失败:", error);
    throw error;
  }
};

/**
 * 保存用户配置
 * @param {Partial<User>} config - 要设置的用户配置
 * @returns {Promise<void>}
 */
export const setUserConfig = async (config: Partial<User>): Promise<void> => {
  try {
    await updateConfig<User>(USER_CONFIG_KEY, config);
  } catch (error) {
    console.error("设置用户配置失败:", error);
    throw error;
  }
};

/** 检查logo路径 */
export const checkLogoPath = async (): Promise<string> => {
  const appDataPath = await appDataDir();
  const logoPath = `${appDataPath}/Image/logo.png`;

  const exists = await ipcFileExists(logoPath);
  if (exists) {
    return `${convertFileSrc(logoPath)}?timestamp=${new Date().getTime()}`;
  } else {
    return "/logo.png";
  }
};
