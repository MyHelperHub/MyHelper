<template>
  <div class="settings-wrap" data-tauri-drag-region>
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <Fieldset legend="常用设置">
      <div class="item">
        <h4>剪切板监听</h4>
        <ToggleSwitch
          v-model="settingData.clipboardListening"
          @change="
            handleSwitch('clipboardListening', settingData.clipboardListening)
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
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import Fieldset from "primevue/fieldset";
import ToggleSwitch from "primevue/toggleswitch";
import { ref } from "vue";
import { getConfig, setConfig } from "@/utils/config.ts";
import { initSetting } from "./utils/settingRegistry.ts";
import { emit } from "@tauri-apps/api/event";
import { ipcCloseWindow } from "@/api/ipc/window.api.ts";

const settingData = ref({
  clipboardListening: false,
});
const init = async () => {
  try {
    initSetting();
    const config = await getConfig(["settingConfig"]);
    if (config) {
      settingData.value = config || settingData.value;
    }
  } catch (error) {
    console.error("获取设置项配置时出错，使用默认值:", error);
  }
};
init();
/**
 * 切换switch事件
 * @param key 设置项的 key
 * @param value 是否启用
 */
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
</script>

<style lang="less">
@import "../../assets/css/variable.less";

.settings-wrap {
  width: 100%;
  height: 100%;
  background-color: rgb(240, 240, 240);
  padding: 10px;
  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
  }
  .item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    --p-toggleswitch-checked-background: rgb(74, 159, 238);
  }
}
</style>
