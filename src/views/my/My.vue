<template>
  <div class="my-container">
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <Fieldset legend="主页头像">
      <div class="avatar-upload-container">
        <div class="avatar-preview">
          <img :src="avatarLogo || '/logo.png'" alt="头像预览" />
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

    <Dialog
      v-model:visible="showCropperModal"
      header="裁剪头像"
      modal
      appendTo="self"
      :closable="false">
      <div class="cropper-container">
        <VueCropper
          ref="cropper"
          :img="cropperImage"
          outputType="png"
          autoCropWidth="70"
          autoCropHeight="70"
          fixedBox
          autoCrop />
      </div>
      <template #footer>
        <Button label="确认裁剪" @click="confirmCrop" />
        <Button label="取消" @click="cancelCrop" class="p-button-secondary" />
      </template>
    </Dialog>

    <Fieldset legend="账号管理" class="account-section">
      <Login />
    </Fieldset>
    <Fieldset legend="我的宠物" class="pet-section">
      <PetList
        :display-width="150"
        :display-height="150"
        @model-changed="onModelChanged"
        @model-loaded="onModelLoaded"
        @model-error="onModelError" />
    </Fieldset>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Fieldset from "primevue/fieldset";
import FileUpload from "primevue/fileupload";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { WindowOperation } from "@/interface/enum";
import { ipcSetLogo } from "@/api/ipc/launch.api";
import { VueCropper } from "vue-cropper";
import "vue-cropper/dist/index.css";
import { emit } from "@tauri-apps/api/event";
import { NewWindowEnum } from "@/interface/windowEnum";
import Login from "./Login.vue";
import { checkLogoPath } from "@/utils/user";
import { PetList } from "@/components/Pet";
import { petManager } from "@/utils/petManager";
import type { ModelConfig, ModelInfo } from "@/interface/pet";

const avatarLogo = ref<string | undefined>();
const showCropperModal = ref(false); // 控制裁剪框的显示状态
const cropper = ref();
const cropperImage = ref();

const init = () => {
  checkLogoPath().then((path) => {
    avatarLogo.value = path;
  });
};
init();
// 选择图片后
const onSelect = (event: any) => {
  const file = event.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      cropperImage.value = e.target?.result as string;
      showCropperModal.value = true; // 显示裁剪框
    };
    reader.readAsDataURL(file);
  }
};

// 裁剪完成后
const confirmCrop = () => {
  cropper.value.getCropData((data: string) => {
    if (data) {
      const base64 = (data as string).replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );
      ipcSetLogo(base64); // 将裁剪后的图片上传
      avatarLogo.value = data;
      cropperImage.value = "";
      showCropperModal.value = false; // 隐藏裁剪框
      emit("update:logo");
    }
  });
};

// 取消裁剪
const cancelCrop = () => {
  cropperImage.value = "";
  showCropperModal.value = false; // 隐藏裁剪框
};

const handleClose = () => {
  ipcWindowControl(WindowOperation.Close, { window_id: NewWindowEnum.My });
};

// Pet相关事件处理函数
const onModelChanged = async (modelConfig: ModelConfig | null) => {
  console.log("My: 模型切换", modelConfig?.name || "无");
  
  try {
    // 更新全局选中的宠物模型
    await petManager.setSelectedModel(modelConfig);
    console.log("My: 全局宠物模型已更新");
  } catch (error) {
    console.error("My: 更新全局宠物模型失败", error);
  }
};

const onModelLoaded = (modelInfo: ModelInfo) => {
  console.log("My: 模型加载完成", modelInfo);
  
  // 模型加载完成后，宠物管理器会自动缓存模型信息
  // 主页的宠物显示会自动更新
};

const onModelError = (error: string) => {
  console.error("My: 模型加载失败", error);
};
</script>

<style lang="less">
.my-container {
  width: 100%;
  height: 100%;
  background-color: var(--theme-background);
  color: var(--theme-text);
  padding: 10px;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;

  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    color: var(--theme-text-secondary);
    transition: color 0.3s ease;

    &:hover {
      color: var(--theme-primary);
    }
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
      border: 4px solid var(--theme-border);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.3s ease;

      &:hover {
        border-color: var(--theme-primary);
      }

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
        background-color: rgba(var(--theme-primary-rgb), 0.8);
        color: white;
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

  .cropper-container {
    width: 200px;
    height: 150px;
  }

  .account-section {
    margin: 15px 0;
  }

  .pet-section {
    margin: 15px 0;

    :deep(.p-fieldset) {
      min-height: 300px;
    }

    :deep(.p-fieldset-content) {
      padding: 8px !important;
      min-height: 250px;
    }
  }

  // 特殊的文件上传样式覆盖
  :deep(.p-fileupload) {
    .p-fileupload-choose {
      background: transparent !important;
      border: none !important;
      color: white !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 50% !important;

      &:hover {
        background: transparent !important;
      }

      .p-button-label {
        color: white !important;
        font-size: 12px !important;
      }
    }
  }
}
</style>
