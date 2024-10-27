<template>
  <div class="my-container">
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <Fieldset legend="主页头像">
      <div class="avatar-upload-container">
        <div class="avatar-preview">
          <img :src="avatarUrl || '/logo.png'" alt="头像预览" />
          <FileUpload
            class="upload-overlay"
            mode="basic"
            accept="image/*"
            choose-label="上传"
            choose-icon="pi"
            @select="onSelect"
            customUpload
            auto />
        </div>
      </div>
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Fieldset from "primevue/fieldset";
import FileUpload from "primevue/fileupload";
import { ipcCloseWindow } from "@/api/ipc/window.api";
import { ipcSetLocalIcon } from "@/api/ipc/launch.api";

const avatarUrl = ref<string | undefined>();

const onSelect = (event: any) => {
  const file = event.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarUrl.value = e.target?.result as string;
      ipcSetLocalIcon(2, null, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const handleClose = () => {
  ipcCloseWindow("my");
};
</script>

<style lang="less">
.my-container {
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

  .avatar-upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;

    .avatar-preview {
      position: relative;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 4px solid rgba(230, 235, 240, 0.8);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .upload-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        color: #fff;
        font-size: 16px;
        opacity: 0;
        visibility: hidden;
        transition:
          opacity 0.2s ease,
          visibility 0.2s ease;
        border-radius: 50%;
        text-wrap: nowrap;
        .pi {
          display: none;
        }
      }

      &:hover .upload-overlay {
        opacity: 1;
        visibility: visible;
      }
    }
  }
}
</style>
