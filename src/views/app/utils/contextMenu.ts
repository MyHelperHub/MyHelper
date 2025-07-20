import { AppItem } from "@/interface/app";
import { useContextMenu } from "@/composables/useContextMenu";
import { emit } from "@/utils/eventBus";
import type { MenuItem } from "primevue/menuitem";

// 使用通用的 contextMenu 组合式函数
const { contextMenuRef, menuItems, showContextMenu } = useContextMenu();

/**
 * 获取 App 项的菜单项
 */
function getContextMenuItems(item: AppItem): MenuItem[] {
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
export function handleContextMenu(event: MouseEvent, item: AppItem) {
  const items = getContextMenuItems(item);
  showContextMenu(event, items);
}

export { contextMenuRef, menuItems };
