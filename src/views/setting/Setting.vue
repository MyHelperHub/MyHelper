<template>
  <div class="settings-wrap" v-window-drag>
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <div class="layout-container">
      <div class="menu-container">
        <div class="custom-menu">
          <div
            v-for="config in menuConfigs"
            :key="config.type"
            class="menu-item"
            :class="{ active: activeMenu === config.type }"
            @click="handleMenuClick(config.type)">
            <i :class="config.icon" class="menu-icon"></i>
            <span class="menu-label">{{ config.label }}</span>
          </div>
        </div>
      </div>
      <div class="content-container">
        <KeepAlive :include="loadedComponents">
          <component :is="currentComponent" :key="activeMenu" />
        </KeepAlive>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, markRaw } from "vue";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { WindowOperation } from "@/types/enum";
import { initSetting } from "./utils/settingRegistry";
import { SettingMenuItemEnum } from "@/types/enum";
import { NewWindowEnum } from "@/types/windowEnum";
import { Logger } from "@/utils/logger";

type MenuConfig = {
  type: SettingMenuItemEnum;
  label: string;
  icon: string;
  componentName: string;
  loader: () => Promise<any>;
};

/** 当前活动菜单 */
const activeMenu = ref<SettingMenuItemEnum | null>(null);
/** 已加载的组件列表 */
const loadedComponents = ref<string[]>([]);
/** 组件映射表 */
const componentMap = reactive<Record<string, any>>({});

/** 统一的菜单配置 */
const menuConfigs: MenuConfig[] = [
  {
    type: SettingMenuItemEnum.General,
    label: "常用设置",
    icon: "pi pi-cog",
    componentName: "GeneralSettings",
    loader: () => import("@/views/setting/GeneralSettings.vue"),
  },
  {
    type: SettingMenuItemEnum.Theme,
    label: "主题设置",
    icon: "pi pi-palette",
    componentName: "ThemeSettings",
    loader: () => import("@/views/setting/ThemeSettings.vue"),
  },
  {
    type: SettingMenuItemEnum.Pet,
    label: "宠物设置",
    icon: "pi pi-heart",
    componentName: "PetSettings",
    loader: () => import("@/views/setting/PetSettings.vue"),
  },
  {
    type: SettingMenuItemEnum.About,
    label: "关于",
    icon: "pi pi-info-circle",
    componentName: "AboutSettings",
    loader: () => import("@/views/setting/AboutSettings.vue"),
  },
];

/** 计算当前组件 */
const currentComponent = computed(() => {
  return activeMenu.value ? componentMap[activeMenu.value] || null : null;
});

/** 加载组件 */
const loadComponent = async (menuType: SettingMenuItemEnum) => {
  if (!componentMap[menuType]) {
    const config = menuConfigs.find((item) => item.type === menuType);
    if (!config) return;

    try {
      const componentModule = await config.loader();
      componentMap[menuType] = markRaw(componentModule.default);

      if (!loadedComponents.value.includes(config.componentName)) {
        loadedComponents.value.push(config.componentName);
      }
    } catch (error) {
      Logger.error(error, `加载 ${menuType} 组件失败:`);
    }
  }
};

/** 处理菜单点击 */
const handleMenuClick = async (menuType: SettingMenuItemEnum) => {
  await loadComponent(menuType);
  activeMenu.value = menuType;
};

onMounted(async () => {
  await loadComponent(SettingMenuItemEnum.General);
  activeMenu.value = SettingMenuItemEnum.General;
});

/** 初始化设置 */
initSetting();

/** 处理关闭 */
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

      .custom-menu {
        padding: 16px 0;
        height: 100%;

        .menu-item {
          position: relative;
          display: flex;
          align-items: center;
          padding: 10px 20px;
          margin: 0 10px 8px 0px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--theme-text-muted);
          border-radius: 8px;
          font-size: 14px;

          &::before {
            content: "";
            position: absolute;
            left: 0;
            top: 50%;
            width: 3px;
            height: 0;
            background: var(--theme-primary);
            border-radius: 0 2px 2px 0;
            transform: translateY(-50%);
            transition: height 0.3s ease;
          }

          &:hover {
            background: var(--theme-background);
            color: var(--theme-text);
            transform: translateX(4px);
            box-shadow: var(--theme-shadow-sm);

            &::before {
              height: 20px;
            }

            .menu-icon {
              color: var(--theme-primary);
              transform: scale(1.1);
            }
          }

          &.active {
            background: linear-gradient(
              135deg,
              var(--theme-primary),
              var(--theme-primary-dark, var(--theme-primary))
            );
            color: var(--theme-background);
            transform: translateX(6px);
            box-shadow: var(--theme-shadow-md);

            &::before {
              height: 100%;
              background: rgba(var(--theme-background-rgb), 0.3);
            }

            .menu-icon {
              color: var(--theme-background);
              transform: scale(1.1);
            }
          }

          .menu-icon {
            margin-right: 14px;
            font-size: 18px;
            transition: all 0.3s ease;
            width: 20px;
            text-align: center;
          }

          .menu-label {
            font-weight: 500;
            letter-spacing: 0.5px;
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
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }
}
</style>
