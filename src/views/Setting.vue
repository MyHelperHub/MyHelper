<template>
  <div class="settings-wrap">
    <Fieldset legend="常用设置">
      <div class="item">
        <InputText placeholder="请输入内容" />
        <ToggleSwitch v-model="commonSettings.clipboardListening" />
      </div>
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import Fieldset from "primevue/fieldset";
import InputText from "primevue/inputtext";
import ToggleSwitch from "primevue/toggleswitch";
import { ref } from "vue";

const commonSettings = ref({
  clipboardListening: false,
});
</script>

<style lang="less">
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
