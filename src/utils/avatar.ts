import { ipcFileExists } from "@/api/ipc/launch.api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";

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
