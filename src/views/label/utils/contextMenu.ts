import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/window";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { WindowOperation } from "@/interface/enum";
import { NewWindowEnum } from "@/interface/windowEnum";

let isAlwaysOnTop = false; // 用于跟踪窗口是否置顶

export async function showContextMenu(event: MouseEvent) {
  const toggleItem = await MenuItem.new({
    text: isAlwaysOnTop ? "取消置顶" : "置顶",
    action: async () => {
      isAlwaysOnTop = !isAlwaysOnTop; // 切换状态
      await ipcWindowControl(
        WindowOperation.ToggleAlwaysOnTop,
        { window_id: NewWindowEnum.Label, always_on_top: isAlwaysOnTop }
      );
    },
  });

  const menu = await Menu.new({
    items: [toggleItem],
  });

  const position = new LogicalPosition(event.clientX, event.clientY);
  await menu.popup(position);
}
