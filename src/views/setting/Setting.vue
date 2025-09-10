<template>
  <div class="settings-wrap" data-tauri-drag-region>
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <div class="layout-container">
      <div class="menu-container">
        <Menu :model="menuItems" />
      </div>
      <div class="content-container" data-tauri-drag-region>
        <KeepAlive :include="loadedComponents">
          <component :is="currentComponent" :key="activeMenu" />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Menu from "primevue/menu";
import { ref, computed, reactive, onMounted, markRaw } from "vue";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { WindowOperation } from "@/interface/enum";
import { initSetting } from "./utils/settingRegistry";
import { SettingMenuItemEnum } from "@/interface/enum";
import { NewWindowEnum } from "@/interface/windowEnum";

const activeMenu = ref<SettingMenuItemEnum | null>(null);
const loadedComponents = ref<string[]>([]);

// 使用 reactive 存储已加载的组件
const componentMap = reactive<Record<string, any>>({});

// 组件加载映射
const componentLoaders = {
  [SettingMenuItemEnum.General]: () =>
    import("@/views/setting/GeneralSettings.vue"),
  [SettingMenuItemEnum.Theme]: () =>
    import("@/views/setting/ThemeSettings.vue"),
  [SettingMenuItemEnum.Pet]: () => import("@/views/setting/PetSettings.vue"),
  [SettingMenuItemEnum.About]: () =>
    import("@/views/setting/AboutSettings.vue"),
};

// 组件名称映射，用于 KeepAlive 的 include
const componentNames = {
  [SettingMenuItemEnum.General]: "GeneralSettings",
  [SettingMenuItemEnum.Theme]: "ThemeSettings",
  [SettingMenuItemEnum.Pet]: "PetSettings",
  [SettingMenuItemEnum.About]: "AboutSettings",
};

// 当前组件
const currentComponent = computed(() => {
  return activeMenu.value ? componentMap[activeMenu.value] || null : null;
});

// 加载组件的函数
const loadComponent = async (menuType: SettingMenuItemEnum) => {
  if (!componentMap[menuType]) {
    try {
      const componentModule = await componentLoaders[menuType]();
      componentMap[menuType] = markRaw(componentModule.default);

      // 添加到 KeepAlive 的 include 列表
      const componentName = componentNames[menuType];
      if (!loadedComponents.value.includes(componentName)) {
        loadedComponents.value.push(componentName);
      }
    } catch (error) {
      console.error(`Failed to load component for ${menuType}:`, error);
    }
  }
};

const menuItems = computed(() => [
  {
    label: "常用设置",
    icon: "pi pi-cog",
    class: activeMenu.value === SettingMenuItemEnum.General ? "p-focus" : "",
    command: async () => {
      await loadComponent(SettingMenuItemEnum.General);
      activeMenu.value = SettingMenuItemEnum.General;
    },
  },
  {
    label: "主题设置",
    icon: "pi pi-palette", 
    class: activeMenu.value === SettingMenuItemEnum.Theme ? "p-focus" : "",
    command: async () => {
      await loadComponent(SettingMenuItemEnum.Theme);
      activeMenu.value = SettingMenuItemEnum.Theme;
    },
  },
  {
    label: "宠物设置", 
    icon: "pi pi-heart",
    class: activeMenu.value === SettingMenuItemEnum.Pet ? "p-focus" : "",
    command: async () => {
      await loadComponent(SettingMenuItemEnum.Pet);
      activeMenu.value = SettingMenuItemEnum.Pet;
    },
  },
  {
    label: "关于",
    icon: "pi pi-info-circle",
    class: activeMenu.value === SettingMenuItemEnum.About ? "p-focus" : "",
    command: async () => {
      await loadComponent(SettingMenuItemEnum.About);
      activeMenu.value = SettingMenuItemEnum.About;
    },
  },
]);

onMounted(async () => {
  await loadComponent(SettingMenuItemEnum.General);
  activeMenu.value = SettingMenuItemEnum.General;
});

initSetting();

const handleClose = () => {
  ipcWindowControl(WindowOperation.Close, { window_id: NewWindowEnum.Setting });
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
        border-radius: 0;
        box-shadow: none;
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
