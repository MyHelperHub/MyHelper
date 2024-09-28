<template>
  <div data-tauri-drag-region>拖拽</div>
  <button @click="toggleWindowSize">Toggle window size</button>
  <button @click="openNewWindow">Open new window</button>

  <div>
    <button @click="selectFile">选择文件</button>
    <button @click="getWebIcon">getWebIcon</button>
    <button @click="send">send</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

const send = async () => {
  // 检查权限并发送通知
  const sendNotificationWithPermission = async () => {
    sendNotification({ title: "Tauri", body: "Tauri is awesome!" ,autoCancel:true });
  };

  // 检查是否已经获得权限
  let permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    // 请求权限
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }

  // 如果权限被授予，则发送通知
  if (permissionGranted) {
    await sendNotificationWithPermission();
  } else {
    console.log("Notification permission not granted");
  }
};

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
  const file:any = await open({
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
  invoke("get_web_icon", { url: "https://google.com" }).then((res) => {
    console.log(res);
  });
};
</script>
