import { AppItem } from "@/interface/app";
import { emit } from "@/utils/eventBus";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/window";

export async function showContextMenu(event: MouseEvent, item: AppItem) {
  const menuItems = await Promise.all([
    MenuItem.new({
      text: "删除",
      action: () => {
        emit("deleteAppItem", item.id);
      },
    }),
  ]);

  const menu = await Menu.new({
    items: menuItems,
  });

  const position = new LogicalPosition(event.clientX, event.clientY);
  await menu.popup(position);
}
