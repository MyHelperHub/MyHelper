import { QuickInputItem } from "@/types/common";
import { useContextMenu } from "@/composables/useContextMenu";
import { emit } from "@/utils/eventBus";
import type { MenuItem } from "primevue/menuitem";

// 主菜单 - 使用通用的 contextMenu 组合式函数
const { contextMenuRef, menuItems, showContextMenu } = useContextMenu();

const {
  contextMenuRef: clipboardContextMenuRef,
  menuItems: clipboardMenuItems,
  showContextMenu: showClipboardContextMenu,
} = useContextMenu();

/**
 * 获取 QuickInput 项的菜单项
 */
function getContextMenuItems(item: QuickInputItem): MenuItem[] {
  return [
    {
      label: "编辑",
      icon: "pi pi-pencil",
      command: () => {
        emit("edit-quickInputItem", item);
      },
    },
    {
      separator: true,
    },
    {
      label: "删除",
      icon: "pi pi-trash",
      command: () => {
        emit("delete-quickInputItem", item.id);
      },
    },
  ];
}

/**
 * 获取 Clipboard 项的菜单项
 */
function getClipboardContextMenuItems(item: QuickInputItem): MenuItem[] {
  return [
    {
      label: "删除",
      icon: "pi pi-trash",
      command: () => {
        emit("delete-clipboardItem", item.id);
      },
    },
  ];
}

/**
 * 处理右键菜单事件
 */
export function handleContextMenu(event: MouseEvent, item: QuickInputItem) {
  const items = getContextMenuItems(item);
  showContextMenu(event, items);
}

/**
 * 处理 Clipboard 右键菜单事件
 */
export function handleClipboardContextMenu(
  event: MouseEvent,
  item: QuickInputItem,
) {
  const items = getClipboardContextMenuItems(item);
  showClipboardContextMenu(event, items);
}

export {
  contextMenuRef,
  menuItems,
  clipboardContextMenuRef,
  clipboardMenuItems,
};
