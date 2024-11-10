<template>
  <div class="setting-section">
    <h3>常用设置</h3>
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
      <div class="item-right" @click="showDataResetModal = true">
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
      <div class="modal-content">
        <Button
          class="modal-button"
          label="常用网站重置"
          severity="info"
          variant="outlined"
          @click="handleDataReset(['webConfig'], $event)"></Button>
        <Button
          class="modal-button"
          label="常用软件重置"
          severity="info"
          variant="outlined"
          @click="handleDataReset(['appConfig'], $event)"></Button>
        <Button
          class="modal-button"
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
import { getConfig, setConfig } from "@/utils/config";
import { emit as tauriEmit } from "@tauri-apps/api/event";
import { ipcDeleteConfig } from "@/api/ipc/config.api";
import { showMessage } from "@/utils/message";

const settingData = ref({
  clipboardListening: false,
});

const showDataResetModal = ref(false);
const confirm = useConfirm();

// 初始化设置
const init = async () => {
  try {
    const config = await getConfig(["settingConfig"]);
    if (config) {
      settingData.value = config || settingData.value;
    }
  } catch (error) {
    console.error("获取设置项配置时出错，使用默认值:", error);
  }
};

init();

const handleSwitch = async (key: string, value: boolean) => {
  tauriEmit("update:setting", {
    key,
    value,
  });
  setConfig(["settingConfig"], settingData.value);
};

const handleDataReset = (key: string[], event: { currentTarget: any }) => {
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
      showDataResetModal.value = false;
    },
    reject: () => {
      return;
    },
  });
};
</script>

<style lang="less">
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    --p-toggleswitch-checked-background: rgb(74, 159, 238);
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
}

.modal-content {
  display: flex;
  flex-direction: column;
  padding: 1rem;

  .modal-button {
    margin-bottom: 0.5rem;
  }
}
</style>
