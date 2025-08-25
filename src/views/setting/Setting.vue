<template>
  <div class="settings-wrap" data-tauri-drag-region>
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <div class="layout-container">
      <div class="menu-container">
        <Menu :model="menuItems" @menuitem-click="handleMenuClick" />
      </div>
      <div class="content-container" data-tauri-drag-region>
        <GeneralSettings v-show="activeMenu === SettingMenuItemEnum.General" />
        <ThemeSettings v-show="activeMenu === SettingMenuItemEnum.Theme" />
        <PetSettings v-show="activeMenu === SettingMenuItemEnum.Pet" />
        <AboutSettings v-show="activeMenu === SettingMenuItemEnum.About" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Menu from "primevue/menu";
import { ref } from "vue";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { WindowOperation } from "@/interface/enum";
import { initSetting } from "./utils/settingRegistry";
import GeneralSettings from "@/views/setting/GeneralSettings.vue";
import AboutSettings from "@/views/setting/AboutSettings.vue";
import ThemeSettings from "@/views/setting/ThemeSettings.vue";
import PetSettings from "@/views/setting/PetSettings.vue";
import { SettingMenuItemEnum } from "@/interface/enum";
import { NewWindowEnum } from "@/interface/windowEnum";

const activeMenu = ref(SettingMenuItemEnum.General);

const menuItems = ref([
  {
    label: "常用设置",
    class: "font-bold",
    icon: "pi pi-cog",
    command: () => (activeMenu.value = SettingMenuItemEnum.General),
  },
  {
    label: "主题设置",
    class: "font-bold",
    icon: "pi pi-palette",
    command: () => (activeMenu.value = SettingMenuItemEnum.Theme),
  },
  {
    label: "宠物设置",
    class: "font-bold",
    icon: "pi pi-heart",
    command: () => (activeMenu.value = SettingMenuItemEnum.Pet),
  },
  {
    label: "关于",
    class: "font-bold",
    icon: "pi pi-info-circle",
    command: () => (activeMenu.value = SettingMenuItemEnum.About),
  },
]);

initSetting();

const handleClose = () => {
  ipcWindowControl(WindowOperation.Close, { window_id: NewWindowEnum.Setting });
};

const handleMenuClick = (event: any) => {
  event.item.command();
};
</script>

<style lang="less">
@import "../../assets/css/variable.less";

.settings-wrap {
  width: 100%;
  height: 100%;
  background: var(--theme-background);
  color: var(--theme-text);

  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    z-index: 1;
    color: var(--theme-text-muted);
    font-size: 16px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--theme-text);
      transform: scale(1.1);
    }
  }

  .layout-container {
    display: flex;
    height: 100%;

    .menu-container {
      width: 170px;
      height: 100%;
      background: var(--theme-background-secondary);

      .p-menu {
        height: 100%;
        width: 100%;
        border: none;
        min-width: 80%;
        background: var(--theme-background-secondary);
        border-radius: 0;
        box-shadow: none;

        .p-menuitem-link {
          color: var(--theme-text);
          padding: 12px 16px;
          background: transparent;

          &:hover {
            background: rgba(var(--theme-primary-rgb), 0.1) !important;
            color: var(--theme-primary);
          }

          &:focus,
          &.p-focus,
          &[data-p-focused="true"] {
            background: rgba(var(--theme-primary-rgb), 0.15) !important;
            color: var(--theme-primary);

            .p-menuitem-icon {
              color: var(--theme-primary);
            }

            .p-menu-item-label {
              color: var(--theme-primary);
            }
          }

          .p-menuitem-icon {
            color: var(--theme-text-secondary);
            margin-right: 8px;
          }

          &:hover .p-menuitem-icon {
            color: var(--theme-primary);
          }

          .p-menuitem-text {
            color: inherit;
          }

          .p-menu-item-label {
            color: var(--theme-text);
          }

          &:hover .p-menu-item-label {
            color: var(--theme-primary);
          }
        }
      }
    }

    .content-container {
      flex: 1;
      padding: 20px 10px;
      background: var(--theme-background);
      overflow-y: auto;
      overflow-x: hidden;
      height: 100%;
    }

    .content-container::-webkit-scrollbar {
      display: none;
    }

    .content-container {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
    }
  }
}
</style>
