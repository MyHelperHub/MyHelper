<template>
  <div style="width: 100%; height: fit-content; -webkit-app-region: drag">
    拖拽
  </div>
  <button @click="toggleWindowSize">Toggle window size</button>
  <button @click="openNewWindow">Open new window</button>

  <div>
    <button @click="selectFile">选择文件</button>
    <button @click="getWebIcon">getWebIcon</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

const isLarge = ref(false);

function toggleWindowSize() {
  const [width, height] = isLarge.value ? [200, 200] : [500, 500];
  invoke("set_window_size", { width, height });
  isLarge.value = !isLarge.value;
}
function openNewWindow() {
  invoke("open_new_window");
}

const selectFile = async () => {
  const file = await open({
    multiple: false,
    directory: false,
  });
  invoke("get_app_icon", {
    exePath: file.path,
  }).then((res) => {
    console.log(res);
  });

};

const getWebIcon = () => {
  invoke("get_web_icon", { url: "https://ialtone.xyz" }).then((res) => {
    console.log(res);
  });
};
</script>
