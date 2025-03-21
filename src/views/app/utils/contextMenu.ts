import { AppItem } from "@/interface/app";
import { emit } from "@/utils/eventBus";
import type { MenuItem } from "primevue/menuitem";
import { ref } from "vue";

export const contextMenuRef = ref();
export const menuItems = ref<MenuItem[]>([]);

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

export function handleContextMenu(event: MouseEvent, item: AppItem) {
  menuItems.value = getContextMenuItems(item);
  contextMenuRef.value.show(event);
}
