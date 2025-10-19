<template>
  <div class="general-settings">
    <h3>常用设置</h3>
    <div class="setting-item">
      <h4>剪贴板监听</h4>
      <ToggleSwitch
        v-model="settingData.clipboardListening"
        @change="
          handleChange('clipboardListening', settingData.clipboardListening)
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
    <div class="setting-item">
      <h4>全局快捷键</h4>
      <ToggleSwitch
        v-model="settingData.hotkey.enabled"
        @change="handleChange('hotkey.enabled', settingData.hotkey.enabled)">
        <template #handle="{ checked }">
          <i
            :class="[
              '!text-xs pi',
              { 'pi-check': checked, 'pi-times': !checked },
            ]"></i>
        </template>
      </ToggleSwitch>
    </div>
    <!-- 使用快捷键设置组件 -->
    <HotkeySettings v-model="settingData.hotkey" @change="handleHotkeyChange" />

    <div class="setting-item">
      <h4>开机启动</h4>
      <ToggleSwitch
        v-model="settingData.autoStart"
        @change="handleChange('autoStart', settingData.autoStart)">
        <template #handle="{ checked }">
          <i
            :class="[
              '!text-xs pi',
              { 'pi-check': checked, 'pi-times': !checked },
            ]"></i>
        </template>
      </ToggleSwitch>
    </div>

    <div class="setting-item">
      <h4>数据重置</h4>
      <div class="item-action" @click="showDataResetModal = true">
        <i class="pi pi-angle-right"></i>
      </div>
    </div>

    <!-- 数据重置对话框 -->
    <Dialog
      v-model:visible="showDataResetModal"
      :dismissableMask="true"
      header="数据重置"
      modal
      appendTo="self"
      :closable="false">
      <ConfirmPopup></ConfirmPopup>
      <div class="reset-modal-content">
        <Button
          class="reset-button"
          label="常用网站重置"
          severity="info"
          variant="outlined"
          @click="handleDataReset(['webConfig'], $event)"></Button>
        <Button
          class="reset-button"
          label="常用软件重置"
          severity="info"
          variant="outlined"
          @click="handleDataReset(['appConfig'], $event)"></Button>
        <Button
          class="reset-button"
          label="全部重置"
          severity="info"
          variant="outlined"
          @click="handleDataReset([], $event)"></Button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import ToggleSwitch from "primevue/toggleswitch";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import ConfirmPopup from "primevue/confirmpopup";
import { useConfirm } from "primevue/useconfirm";
import { ref } from "vue";
import { getConfig, setConfig, resetConfig } from "@/utils/config";
import { emit as tauriEmit } from "@tauri-apps/api/event";
import { showMessage } from "@/composables/message.ts";
import HotkeySettings from "./components/HotkeySettings.vue";
import {
  setHotkeyEnabled,
  getDefaultHotkeyConfig,
} from "@/composables/hotkey.ts";
import { Logger } from "@/utils/logger";

const settingData = ref({
  clipboardListening: false,
  hotkey: getDefaultHotkeyConfig(),
  autoStart: false,
});

const showDataResetModal = ref(false);
const confirm = useConfirm();

// 初始化设置
const init = async () => {
  try {
    const config = await getConfig("settingConfig");
    if (config) {
      settingData.value = { ...settingData.value, ...config };
    } else {
      // 如果没有配置，设置默认值
      await setConfig("settingConfig", settingData.value);
    }
  } catch (error) {
    Logger.error(error, "获取设置项配置时出错，使用默认值:");
  }
};

init();

/**
 * 统一的设置变更处理函数
 * @param key 设置项的键
 * @param value 设置项的值
 */
const handleChange = async (key: string, value: any) => {
  tauriEmit("update:setting", {
    key,
    value,
  });

  // 如果是修改快捷键启用状态，立即应用设置
  if (key === "hotkey.enabled") {
    await setHotkeyEnabled(settingData.value.hotkey);
  }

  await setConfig("settingConfig", settingData.value);
};
/** 快捷键设置变更处理函数(小按钮) */
const handleHotkeyChange = async () => {
  await setHotkeyEnabled(settingData.value.hotkey);
  await setConfig("settingConfig", settingData.value);
};

const handleDataReset = async (
  keys: string[],
  event: { currentTarget: any },
) => {
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
    accept: async () => {
      try {
        await resetConfig(keys);
        showMessage("重置成功！", 2500, 1);
      } catch (error) {
        Logger.error(error, "重置数据失败:");
        showMessage("重置失败，请重试！", 2500, 2);
      }
      showDataResetModal.value = false;
    },
    reject: () => {
      return;
    },
  });
};
</script>

<style lang="less">
.general-settings {
  color: var(--theme-text);

  h3 {
    margin-bottom: 20px;
    font-size: 1.2rem;
    color: var(--theme-text);
  }

  .setting-item {
    width: 100%;
    padding: 0 10px;
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    --p-toggleswitch-checked-background: var(--theme-primary);

    &:hover {
      background-color: rgba(
        var(--theme-background-secondary-rgb),
        var(--theme-transparency-background-secondary)
      );
      box-shadow: var(--theme-shadow-sm);
    }

    .item-action {
      width: 50px;
      display: flex;
      justify-content: end;
      cursor: pointer;
    }
  }
}

.reset-modal-content {
  display: flex;
  flex-direction: column;
  padding: 1rem;

  .reset-button {
    margin-bottom: 0.5rem;
  }
}
</style>
