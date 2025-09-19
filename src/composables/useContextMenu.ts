import type { MenuItem } from "primevue/menuitem";
import { ref, Ref } from "vue";

export type UseContextMenuReturn = {
  contextMenuRef: Ref;
  menuItems: Ref<MenuItem[]>;
  showContextMenu: (event: MouseEvent, items: MenuItem[]) => void;
};

/**
 * 通用的右键菜单组合式函数
 * 只负责显示菜单，具体菜单项由调用方提供
 * @returns 右键菜单相关的响应式数据和方法
 */
export function useContextMenu(): UseContextMenuReturn {
  const contextMenuRef = ref();
  const menuItems = ref<MenuItem[]>([]);

  /**
   * 显示右键菜单
   * @param event 鼠标事件
   * @param items 菜单项列表
   */
  function showContextMenu(event: MouseEvent, items: MenuItem[]) {
    menuItems.value = items;
    contextMenuRef.value.show(event);
  }

  return {
    contextMenuRef,
    menuItems,
    showContextMenu,
  };
}
