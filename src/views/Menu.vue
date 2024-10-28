<template>
  <div class="menu-container" @click.capture="handleClickOutside">
    <div class="menu-list">
      <div class="menu-item" @click="openCommon('commonWeb')">
        <div class="menu-text">常用网站</div>
        <Transition name="fade">
          <CommonWeb v-if="commonState.commonWeb" @click.stop />
        </Transition>
      </div>
      <div class="menu-item" @click="openCommon('commonApp')">
        <div class="menu-text">常用软件</div>
        <Transition name="fade">
          <CommonApp v-if="commonState.commonApp" @click.stop />
        </Transition>
      </div>
      <div class="menu-item" @click="openLabel">
        <div class="menu-text">桌面便签</div>
      </div>
      <div class="menu-item" @click="openCommon('quickInput')">
        <div class="menu-text">快捷输入</div>
        <Transition name="fade">
          <QuickInput v-if="commonState.quickInput" @click.stop />
        </Transition>
      </div>
      <div class="menu-item">
        <div class="menu-text">CHATGPT</div>
      </div>
      <div class="menu-item">
        <div class="menu-text">插件市场</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CommonWeb from "@/views/web/CommonWeb.vue";
import CommonApp from "@/views/app/CommonApp.vue";
import QuickInput from "@/views/quick-input/QuickInput.vue";
import { ref } from "vue";
import { CommonState, ContainState } from "@/interface/menu";
import { ipcCloseWindow, ipcCreateNewWindow } from "@/api/ipc/window.api";
import { on } from "@/utils/eventBus";

// 控制每个菜单项的展开与关闭状态
const commonState = ref<CommonState>({
  commonWeb: false,
  commonApp: false,
  quickInput: false,
});
const containState = ref<ContainState>({
  label: false,
});

/** 关闭所有菜单 */
const closeAllMenu = () => {
  // 断言 Object.keys 返回的键是 CommonState 的键
  (Object.keys(commonState.value) as (keyof CommonState)[]).forEach((k) => {
    commonState.value[k] = false;
  });
};

/** 打开菜单项 */
const openCommon = (key: keyof CommonState) => {
  // 如果当前点击的项已经是打开的，则关闭它
  if (commonState.value[key]) {
    commonState.value[key] = false;
  } else {
    closeAllMenu();
    commonState.value[key] = true;
  }
};

/** 打开桌面便签 */
const openLabel = () => {
  /** 创建桌面便签 */
  if (containState.value.label) {
    containState.value.label = false;
    ipcCloseWindow("label").catch((err) => {
      if (err === "label") {
        ipcCreateNewWindow("label", "桌面便签", "#/label", [210, 250]);
        containState.value.label = true;
      }
    });
  } else {
    ipcCreateNewWindow("label", "桌面便签", "#/label", [210, 250]);
    containState.value.label = true;
  }
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
  width: 100%;
  height: 100%;
  margin-top: 65px;

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
          height: 100%;
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
          border-top: 2px solid rgb(54, 56, 55);
          border-right: 2px solid rgb(54, 56, 55);
          transition:
            height 0.15s ease-in,
            width 0.2s 0.15s linear,
            opacity 0s 0.35s;
        }

        &::after {
          bottom: 0;
          border-bottom: 2px solid rgb(54, 56, 55);
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
