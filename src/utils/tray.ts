// tray.ts
import { Menu } from '@tauri-apps/api/menu/menu';
import { MenuItem } from '@tauri-apps/api/menu/menuItem';
import { PredefinedMenuItem } from '@tauri-apps/api/menu/predefinedMenuItem';
import { Submenu } from '@tauri-apps/api/menu/submenu';
import { TrayIcon } from '@tauri-apps/api/tray';

export async function setupTray() {
    //图标路径在src-tauri目录下
    const _icon = "icons/32x32.png";

    const subMenu1 = await MenuItem.new({ text: "Sta2rt" });
    const subMenu2 = await MenuItem.new({ text: "Open at Login" });
    //分割线
    const subMenu3 = await PredefinedMenuItem.new({ item: "Separator" });
    const subMenu4 = await MenuItem.new({ enabled: false, text: `Chain Height: ` });
    const subMenu5 = await PredefinedMenuItem.new({ item: "Separator" });
    const subMenu6 = await Submenu.new({
        items: [
            {
                id: "configure",
                text: "Auto-configure"
            },
            {
                id: "help",
                text: "Help"
            }
        ],
        text: "Options"
    });
    const subMenu7 = await MenuItem.new({
        action: () => {
            alert("Test");
        },
        enabled: true,
        id: "quit",
        text: "Quit"
    });

    const newMenu = await Menu.new({
        items: [
            subMenu1,
            subMenu2,
            subMenu3,
            subMenu4,
            subMenu5,
            subMenu6,
            subMenu7
        ]
    });
    const tray = await TrayIcon.new();

    tray.setMenu(newMenu);
    tray.setIcon(_icon);
    tray.setTooltip("Shortcake");
}
