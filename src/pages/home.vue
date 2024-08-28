<template>
  <div style="width: 100%; height: fit-content; -webkit-app-region: drag">
    拖拽
  </div>
  <button @click="toggleWindowSize">Toggle window size</button>
  <button @click="openNewWindow">Open new window</button>

  <div>
    <button @click="selectFile">选择文件</button>
  </div>
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

const selectFile = () => {

  // 将文件路径传递给 Tauri 应用
  invoke('extract_icon_from_exe', {
    exePath: "D:/QQ/QQ.exe",
    outputPath: 'public/app_icon.png',
  })
    .then(path => {
      console.log('图标路径:', path); // 打印路径到控制台
    })
    .catch(error => {
      console.error('错误:', error);
    });
};
</script>