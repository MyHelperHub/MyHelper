<template>
  <div class="settings-wrap" data-tauri-drag-region>
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <div class="layout-container">
      <div class="menu-container">
        <Menu :model="menuItems" @menuitem-click="handleMenuClick" />
      </div>
      <div class="content-container" data-tauri-drag-region>
        <div v-show="activeMenu === 'general'" class="setting-section">
          <h3>常用设置</h3>
          <div class="item">
            <h4>剪切板监听</h4>
            <ToggleSwitch
              v-model="settingData.clipboardListening"
              @change="
                handleSwitch(
                  'clipboardListening',
                  settingData.clipboardListening,
                )
              ">
              <template #handle="{ checked }">
                <i
                  :class="[
                    '!text-xs pi',
                    { 'pi-check': checked, 'pi-times': !checked },
                  ]"></i>
              </template>
            </ToggleSwitch>
          </div>
          <div class="item">
            <h4>数据重置</h4>
            <div class="item-right" @click="showModal.dataReset = true">
              <i class="pi pi-angle-right"></i>
            </div>
          </div>
        </div>
        <div v-show="activeMenu === 'about'" class="setting-section">
          <h3>关于</h3>
          <div class="about">
            <img class="logo" src="/logo.png" />
            <div class="version">{{ version }}</div>
            <Button class="button">检查更新</Button>
            <Button
              class="button"
              label="Info"
              severity="info"
              variant="outlined"
              >意见反馈</Button
            >
          </div>
        </div>
      </div>
    </div>

    <Dialog
      v-model:visible="showModal.dataReset"
      :dismissableMask="true"
      header="数据重置"
      modal
      appendTo="self"
      :closable="false">
      <ConfirmPopup></ConfirmPopup>
      <div class="modal-content">
        <Button
          class="modal-button"
          label="常用网站重置"
          severity="info"
          variant="outlined"
          @click="dataReset(['webConfig'], $event)"></Button>
        <Button
          class="modal-button"
          label="常用软件重置"
          severity="info"
          variant="outlined"
          @click="dataReset(['appConfig'], $event)"></Button>
        <Button
          class="modal-button"
          label="全部重置"
          severity="info"
          variant="outlined"
          @click="dataReset([], $event)"></Button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Menu from "primevue/menu";
import ToggleSwitch from "primevue/toggleswitch";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import ConfirmPopup from "primevue/confirmpopup";
import { useConfirm } from "primevue/useconfirm";
import { ref } from "vue";
import { getConfig, setConfig } from "@/utils/config.ts";
import { initSetting } from "./utils/settingRegistry.ts";
import { emit } from "@tauri-apps/api/event";
import { ipcCloseWindow } from "@/api/ipc/window.api.ts";
import { ipcDeleteConfig } from "@/api/ipc/config.api.ts";
import { showMessage } from "@/utils/message.ts";
import { getVersion } from "@tauri-apps/api/app";

const settingData = ref({
  clipboardListening: false,
});

const showModal = ref({
  dataReset: false,
});
let version: string;

const activeMenu = ref("general");

const menuItems = ref([
  {
    label: "常用设置",
    icon: "pi pi-cog",
    command: () => (activeMenu.value = "general"),
  },
  {
    label: "关于",
    icon: "pi pi-info-circle",
    command: () => (activeMenu.value = "about"),
  },
]);

const confirm = useConfirm();

const init = async () => {
  try {
    initSetting();
    const config = await getConfig(["settingConfig"]);
    if (config) {
      settingData.value = config || settingData.value;
    }
    version = await getVersion();
  } catch (error) {
    console.error("获取设置项配置时出错，使用默认值:", error);
  }
};

init();

const handleSwitch = async (key: string, value: boolean) => {
  emit("update:setting", {
    key,
    value,
  });
  setConfig(["settingConfig"], settingData.value);
};

const handleClose = () => {
  ipcCloseWindow("setting");
};

const handleMenuClick = (event: any) => {
  event.item.command();
};

const dataReset = (key: string[], event: { currentTarget: any }) => {
  confirm.require({
    target: event.currentTarget,
    message: "确认要重置数据吗？",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "取消",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "确定",
    },
    accept: () => {
      ipcDeleteConfig(key)
        .then(() => {
          showMessage("重置成功！", 2500, 1);
        })
        .catch(() => {
          showMessage("重置失败，请重试！", 2500, 2);
        });
      showModal.value.dataReset = false;
    },
    reject: () => {
      return;
    },
  });
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
      width: 200px;
      height: 100%;
      background-color: #ffffff;
      border-right: 1px solid #e0e0e0;

      :deep(.p-menu) {
        width: 100%;
        border: none;
        border-radius: 0;

        .p-menuitem-link {
          padding: 1rem;

          &:hover {
            background-color: #f5f5f5;
          }

          .p-menuitem-icon {
            margin-right: 0.5rem;
          }
        }
      }
    }

    .content-container {
      flex: 1;
      padding: 20px 10px;

      .setting-section {
        h3 {
          margin-bottom: 20px;
          font-size: 1.2rem;
          color: #333;
        }
        .item {
          width: 100%;
          padding: 0 10px;
          border-radius: 10px;
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          --p-toggleswitch-checked-background: rgb(74, 159, 238);

          &:first-child {
            margin-top: 0;
          }
          &:hover {
            background-color: rgba(0, 0, 0, 0.04);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }

          .item-right {
            width: 50px;
            display: flex;
            justify-content: end;
            cursor: pointer;
          }
        }
        .about {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          .logo {
            width: 100px;
            border-radius: 30px;
          }
          .button {
            margin-top: 20px;
          }
        }
      }
    }
  }

  .modal-content {
    background-color: #fff;
    border-radius: 5px;
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 15px;
  }
}
</style>
