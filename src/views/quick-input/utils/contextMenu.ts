import { QuickInputItem } from "@/interface/quickInput";
import { emit } from "@/utils/eventBus";
import type { MenuItem } from "primevue/menuitem";
import { ref } from "vue";

export const contextMenuRef = ref();
export const menuItems = ref<MenuItem[]>([]);

// Clipboard专用的右键菜单引用和菜单项
export const clipboardContextMenuRef = ref();
export const clipboardMenuItems = ref<MenuItem[]>([]);

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

export function handleContextMenu(event: MouseEvent, item: QuickInputItem) {
  menuItems.value = getContextMenuItems(item);
  contextMenuRef.value.show(event);
}

export function handleClipboardContextMenu(
  event: MouseEvent,
  item: QuickInputItem,
) {
  clipboardMenuItems.value = getClipboardContextMenuItems(item);
  clipboardContextMenuRef.value.show(event);
}
