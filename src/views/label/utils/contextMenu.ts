import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/window";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { WindowOperation } from "@/types/enum";
import { NewWindowEnum } from "@/types/windowEnum";

/** 窗口置顶状态跟踪 */
let isAlwaysOnTop = false;

/** 显示右键菜单 */
export async function showContextMenu(event: MouseEvent) {
  const toggleItem = await MenuItem.new({
    text: isAlwaysOnTop ? "取消置顶" : "置顶",
    action: async () => {
      isAlwaysOnTop = !isAlwaysOnTop;
      await ipcWindowControl(WindowOperation.ToggleAlwaysOnTop, {
        window_id: NewWindowEnum.Label,
        always_on_top: isAlwaysOnTop,
      });
    },
  });

  const menu = await Menu.new({
    items: [toggleItem],
  });

  const position = new LogicalPosition(event.clientX, event.clientY);
  await menu.popup(position);
}
