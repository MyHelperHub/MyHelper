import { WebItem } from '@/interface/web';
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { LogicalPosition } from '@tauri-apps/api/window';

export async function showContextMenu(event: MouseEvent, item: WebItem) {
    const menuItems = await Promise.all([
        MenuItem.new({
            text: '编辑',
            action: () => {
                console.log('Menu Item A clicked!', item);
            },
        }),
        PredefinedMenuItem.new({ item: 'Separator' }), // 分隔线
        MenuItem.new({
            text: '删除',
            action: () => {
                console.log('Menu Item B clicked!');
            },
        })
    ]);

    const menu = await Menu.new({
        items: menuItems,
    });

    const position = new LogicalPosition(event.clientX, event.clientY);
    await menu.popup(position);
}
