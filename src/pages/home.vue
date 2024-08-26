<template>
  <div style="width: 100%; height: fit-content; -webkit-app-region: drag">
    拖拽
  </div>
  <button @click="toggleWindowSize">Toggle window size</button>
  <button @click="openNewWindow">Open new window</button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

const isLarge = ref(false);

function toggleWindowSize() {
  const [width, height] = isLarge.value ? [200, 200] : [500, 500];
  invoke("set_window_size", { width, height });
  isLarge.value = !isLarge.value;
}
function openNewWindow() {
  invoke("open_new_window");
}
</script>
