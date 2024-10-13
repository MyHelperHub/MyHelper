import { invoke } from "@tauri-apps/api/core";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/window";

let isAlwaysOnTop = false; // 用于跟踪窗口是否置顶

export async function showContextMenu(event: MouseEvent) {
  const toggleItem = await MenuItem.new({
    text: isAlwaysOnTop ? "取消置顶" : "置顶",
    action: async () => {
      isAlwaysOnTop = !isAlwaysOnTop; // 切换状态
      await invoke("set_window_always_on_top", {
        windowId: "label",
        isAlwaysOnTop: isAlwaysOnTop,
      });
    },
  });

  const menu = await Menu.new({
    items: [toggleItem],
  });

  const position = new LogicalPosition(event.clientX, event.clientY);
  await menu.popup(position);
}
