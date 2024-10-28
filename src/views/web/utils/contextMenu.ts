import { WebItem } from "@/interface/web";
import { emit } from "@/utils/eventBus";
import { Menu, MenuItem, PredefinedMenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/window";

export async function showContextMenu(event: MouseEvent, item: WebItem) {
  const menuItems = await Promise.all([
    MenuItem.new({
      text: "编辑",
      action: () => {
        emit("edit-webItem", item);
      },
    }),
    PredefinedMenuItem.new({ item: "Separator" }), // 分隔线
    MenuItem.new({
      text: "删除",
      action: () => {
        emit("delete-webItem", item.id);
      },
    }),
  ]);

  const menu = await Menu.new({
    items: menuItems,
  });

  const position = new LogicalPosition(event.clientX, event.clientY);
  await menu.popup(position);
}
