import { WebItem } from "@/interface/web";
import { emit } from "@/utils/eventBus";
import type { MenuItem } from "primevue/menuitem";
import { ref } from "vue";

export const contextMenuRef = ref();
export const menuItems = ref<MenuItem[]>([]);

function getContextMenuItems(item: WebItem): MenuItem[] {
  return [
    {
      label: "编辑",
      icon: "pi pi-pencil",
      command: () => {
        emit("edit-webItem", item);
      },
    },
    {
      separator: true,
    },
    {
      label: "删除",
      icon: "pi pi-trash",
      command: () => {
        emit("delete-webItem", item.id);
      },
    },
  ];
}

export function handleContextMenu(event: MouseEvent, item: WebItem) {
  menuItems.value = getContextMenuItems(item);
  contextMenuRef.value.show(event);
}
