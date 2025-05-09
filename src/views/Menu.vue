<template>
  <div class="menu-container" @click.capture="handleClickOutside">
    <div class="menu-list">
      <div class="menu-item" @click="openCommon($event, 'commonWeb')">
        <div class="menu-text">常用网站</div>
        <Transition name="fade">
          <CommonWeb v-if="commonState.commonWeb" />
        </Transition>
      </div>
      <div class="menu-item" @click="openCommon($event, 'commonApp')">
        <div class="menu-text">常用软件</div>
        <Transition name="fade">
          <CommonApp v-if="commonState.commonApp" />
        </Transition>
      </div>
      <div class="menu-item" @click="openLabel">
        <div class="menu-text">桌面便签</div>
      </div>
      <div class="menu-item" @click="openCommon($event, 'quickInput')">
        <div class="menu-text">快捷输入</div>
        <Transition name="fade">
          <QuickInput v-if="commonState.quickInput" />
        </Transition>
      </div>
      <div class="menu-item" @click="openMyPlugin">
        <div class="menu-text">我的插件</div>
        <Transition name="fade">
          <MyPlugin ref="myPluginRef" />
        </Transition>
      </div>
      <div class="menu-item" @click="openPluginMarket">
        <div class="menu-text">插件市场</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CommonWeb from "@/views/web/CommonWeb.vue";
import CommonApp from "@/views/app/CommonApp.vue";
import QuickInput from "@/views/quick-input/QuickInput.vue";
import MyPlugin from "@/views/my-plugin/MyPlugin.vue";
import { ref, toRef } from "vue";
import { CommonState, ContainState } from "@/interface/menu.d";
import { on } from "@/utils/eventBus";
import { handleWindowToggle } from "@/utils/windowManager";
import { NewWindowEnum, WINDOW_CONFIG } from "@/interface/windowEnum";

// 控制每个菜单项的展开与关闭状态
const commonState = ref<CommonState>({
  commonWeb: false,
  commonApp: false,
  quickInput: false,
  myPlugin: false,
});
/** 控制每个菜单项的 ref */
const myPluginRef = ref<InstanceType<typeof MyPlugin> | null>(null);
/** 控制需要新建窗口的状态 */
const containState = ref<ContainState>({
  label: false,
  pluginMarket: false,
});

/** 关闭所有菜单 */
const closeAllMenu = () => {
  // 断言 Object.keys 返回的键是 CommonState 的键
  (Object.keys(commonState.value) as (keyof CommonState)[]).forEach((k) => {
    commonState.value[k] = false;
  });
};

/** 打开菜单项 */
const openCommon = (event: MouseEvent, key: keyof CommonState) => {
  const target = event.target as HTMLElement;
  // 如果点击的元素或其父元素有 keep-menu 属性，不关闭菜单
  if (target.closest("[keep-menu]")) {
    return;
  }
  if (commonState.value[key]) {
    // 如果当前点击的项已经是打开的，则关闭它
    commonState.value[key] = false;
  } else {
    closeAllMenu();
    commonState.value[key] = true;
  }
};

/** 打开桌面便签 */
const openLabel = () => {
  handleWindowToggle(
    WINDOW_CONFIG[NewWindowEnum.Label],
    toRef(containState.value, "label"),
  );
};

const openPluginMarket = () => {
  handleWindowToggle(
    WINDOW_CONFIG[NewWindowEnum.PluginMarket],
    toRef(containState.value, "pluginMarket"),
  );
};

const openMyPlugin = () => {
  myPluginRef.value?.openPopover();
};
/** 点击外侧时关闭菜单项 */
const handleClickOutside = (event: MouseEvent) => {
  // 检查点击事件的目标元素是否是 .menu-container 元素本身
  if (event.target === event.currentTarget) {
    // 如果是，说明点击事件发生在 .menu-container 的空白区域，关闭所有打开的菜单项
    closeAllMenu();
  }
};

on("closeAllMenu", closeAllMenu);
</script>

<style lang="less">
.menu-container {
  position: relative;
  top: -30px;
  width: 100%;
  height: 100%;
  padding-top: 95px;

  .menu-list {
    display: flex;
    flex-wrap: wrap;
    margin: 0 38px 0 30px;

    .menu-item {
      display: inline-block;
      vertical-align: top;
      border: none;
      cursor: pointer;
      margin-top: 10px;
      position: relative;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 2px;
        height: 30%;
        background-color: rgb(54, 56, 55);
        transition: height 0.2s 0.35s ease-out;
        z-index: 1;
      }

      &:hover {
        .menu-text {
          color: rgb(54, 56, 55);
          background-color: rgb(245, 245, 245);

          &::before {
            width: 100%;
            height: 96%;
            opacity: 1;
            transition:
              width 0.2s 0.1s linear,
              height 0.15s 0.3s ease-out,
              opacity 0s 0.1s;
          }

          &::after {
            width: 100%;
            opacity: 1;
            transition:
              width 0.25s 0.2s ease-out,
              opacity 0s 0.2s;
          }
        }

        &::before {
          height: 96%;
          transition: height 0.2s ease-in;
        }
      }

      .menu-text {
        width: 185px;
        height: 40px;
        position: relative;
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
        padding: 15px 20px;
        color: rgb(28, 31, 30);
        transition: 0.3s;

        &::before,
        &::after {
          content: "";
          position: absolute;
          left: 0;
          transition: all 0.25s ease;
          width: 0;
          height: 0;
          background: transparent;
          opacity: 0;
        }

        &::before {
          top: 0;
          border-top: 1vw solid rgb(54, 56, 55);
          border-right: 1vw solid rgb(54, 56, 55);
          transition:
            height 0.15s ease-in,
            width 0.2s 0.15s linear,
            opacity 0s 0.35s;
        }

        &::after {
          bottom: 0;
          border-bottom: 1vw solid rgb(54, 56, 55);
          transition:
            width 0.25s ease-in,
            opacity 0s 0.35s;
        }
      }
    }
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}
</style>
