import { SelectItem } from "@/types/common";
import { useContextMenu } from "@/composables/useContextMenu";
import { emit } from "@/utils/eventBus";
import type { MenuItem } from "primevue/menuitem";

const { contextMenuRef, menuItems, showContextMenu } = useContextMenu();

/**
 * 获取 App 项的菜单项
 */
function getContextMenuItems(item: SelectItem): MenuItem[] {
  return [
    {
      label: "编辑",
      icon: "pi pi-pencil",
      command: () => {
        emit("edit-appItem", item);
      },
    },
    {
      separator: true,
    },
    {
      label: "删除",
      icon: "pi pi-trash",
      command: () => {
        emit("delete-appItem", item.id);
      },
    },
  ];
}

/**
 * 处理右键菜单事件
 */
export function handleContextMenu(event: MouseEvent, item: SelectItem) {
  const items = getContextMenuItems(item);
  showContextMenu(event, items);
}

export { contextMenuRef, menuItems };
