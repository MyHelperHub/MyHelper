<template>
  <div class="settings-wrap" data-tauri-drag-region>
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <div class="layout-container">
      <div class="menu-container">
        <Menu :model="menuItems" @menuitem-click="handleMenuClick" />
      </div>
      <div class="content-container" data-tauri-drag-region>
        <GeneralSettings v-show="activeMenu === SettingMenuItemEnum.General" />
        <AboutSettings v-show="activeMenu === SettingMenuItemEnum.About" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Menu from "primevue/menu";
import { ref } from "vue";
import { ipcCloseWindow } from "@/api/ipc/window.api";
import { initSetting } from "./utils/settingRegistry";
import GeneralSettings from "@/views/setting/GeneralSettings.vue";
import AboutSettings from "@/views/setting/AboutSettings.vue";
import {  SettingMenuItemEnum } from "@/interface/enum";
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
    label: "关于",
    class: "font-bold",
    icon: "pi pi-info-circle",
    command: () => (activeMenu.value = SettingMenuItemEnum.About),
  },
]);

initSetting();

const handleClose = () => {
  ipcCloseWindow(NewWindowEnum.Setting);
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
  background-color: rgb(240, 240, 240);

  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    z-index: 1;
  }

  .layout-container {
    display: flex;
    height: 100%;

    .menu-container {
      width: 170px;
      height: 100%;

      .p-menu {
        height: 100%;
        width: 100%;
        border: none;
        min-width: 80%;
      }
    }

    .content-container {
      flex: 1;
      padding: 20px 10px;
    }
  }
}
</style>
