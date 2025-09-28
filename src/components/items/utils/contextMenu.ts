import { SelectItem } from "@/types/common";
import { useContextMenu } from "@/composables/useContextMenu";
import type { MenuItem } from "primevue/menuitem";

const { contextMenuRef, menuItems, showContextMenu } = useContextMenu();

/**
 * 获取右键菜单项
 */
function getContextMenuItems(
  item: SelectItem,
  onEdit: (item: SelectItem) => void,
  onDelete: (id: number) => void,
): MenuItem[] {
  return [
    {
      label: "编辑",
      icon: "pi pi-pencil",
      command: () => {
        onEdit(item);
      },
    },
    {
      separator: true,
    },
    {
      label: "删除",
      icon: "pi pi-trash",
      command: () => {
        onDelete(item.id);
      },
    },
  ];
}

/**
 * 处理右键菜单事件
 */
export function handleContextMenu(
  event: MouseEvent,
  item: SelectItem,
  onEdit: (item: SelectItem) => void,
  onDelete: (id: number) => void,
) {
  const items = getContextMenuItems(item, onEdit, onDelete);
  showContextMenu(event, items);
}

export { contextMenuRef, menuItems };
