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
      <div class="item">
        <h4>数据重置</h4>
        <div class="item-right" @click="showModal.dataReset = true">
          <i class="pi pi-angle-right"></i>
        </div>
      </div>
    </Fieldset>
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
import Fieldset from "primevue/fieldset";
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

const settingData = ref({
  clipboardListening: false,
});

const showModal = ref({
  dataReset: false,
});

const confirm = useConfirm();
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

/** 关闭窗口 */
const handleClose = () => {
  ipcCloseWindow("setting");
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
  padding: 10px;
  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
  }
  .item {
    width: 100%;
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    --p-toggleswitch-checked-background: rgb(74, 159, 238);
    &:first-child {
      margin-top: 0;
    }
    .item-right {
      width: 50px;
      display: flex;
      justify-content: end;
      cursor: pointer;
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
