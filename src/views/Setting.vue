<template>
  <div class="settings-wrap" data-tauri-drag-region>
    <Fieldset legend="常用设置">
      <div class="item">
        <h4>剪切板监听</h4>
        <ToggleSwitch
          v-model="settingsData.clipboardListening"
          @change="
            handleSwitch(
              settingsData.clipboardListening,
              startClipboardListening,
              stopClipboardListening,
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
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import Fieldset from "primevue/fieldset";
import {
  startClipboardListening,
  stopClipboardListening,
} from "@/utils/clipboard";
import ToggleSwitch from "primevue/toggleswitch";
import { handleSwitch } from "@/utils/common";
import { ref } from "vue";

const settingsData = ref({
  clipboardListening: false,
});
</script>

<style lang="less">
@import "@/assets/css/variable.less";

.settings-wrap {
  width: 100%;
  height: 100%;
  background-color: rgb(240, 240, 240);
  padding: 10px;
  .item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    --p-toggleswitch-checked-background: rgb(74, 159, 238);
  }
}
</style>
