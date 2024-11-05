<template>
  <div class="edit-item">
    <div class="edit-btn-container" @click="showModal = true">
      <slot></slot>
    </div>

    <Dialog
      v-model:visible="showModal"
      @hide="closeModal"
      :dismissableMask="true"
      header="编辑软件"
      modal
      appendTo="self"
      :closable="false">
      <div class="modal-content">
        <img
          v-if="formData.logo"
          class="image"
          :src="convertFileSrc(formData.logo)"
          @click="selectLocalImage" />
        <i v-else class="pi pi-image image" @click="selectLocalImage"></i>
        <div class="input-container">
          <CustomInput
            v-model="formData.title"
            class="input"
            :label="'网站名称'" />
          <transition name="icon">
            <div class="get-icon" @click="getIcon">获取图标</div>
          </transition>
        </div>
        <div class="modal-footer">
          <CustomButton class="button" @click="handleConfirm" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CustomInput from "../../components/CustomInput.vue";
import CustomButton from "../../components/CustomButton.vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { showMessage } from "@/utils/message.ts";
import { hideLoading, showLoading } from "@/utils/loading.ts";
import { open } from "@tauri-apps/plugin-dialog";
import Dialog from "primevue/dialog";
import { ipcGetAppIcon, ipcSetLocalIcon } from "@/api/ipc/launch.api";
import { AppItem } from "@/interface/app";

const emit = defineEmits(["editAppItem"]);

const formData = ref<AppItem>({
  /** -1时为编辑 */
  id: -1,
  title: "",
  src: "",
  logo: "",
});
const showModal = ref(false);

/** 打开AddItem弹窗 */
const openModal = (item: AppItem) => {
  formData.value = item;
  showModal.value = true;
};

const closeModal = () => {
  if (formData.value.id !== -1) {
    formData.value = {
      id: -1,
      title: "",
      src: "",
      logo: "",
    };
  }
};
/** 获取图标方法 */
const getIcon = () => {
  if (!formData.value.src) {
    showMessage("未查询到软件路径");
    return;
  }
  showLoading();

  ipcGetAppIcon(formData.value.src.replace(/\//g, "\\"))
    .then((res) => {
      formData.value.logo = (res as string).replace(/\\/g, "/");
    })
    .catch(() => {
      showMessage("获取图标失败!", 3000, 2);
    })
    .finally(() => {
      hideLoading();
    });
};

/** 选择本地图标 */
const selectLocalImage = async () => {
  const filePath = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: "请选择图片类型",
        extensions: ["png", "jpeg", "jpg", "webp", "ico", "gif", "bmp"],
      },
    ],
  });

  if (filePath) {
    ipcSetLocalIcon(filePath, 1)
      .then((res) => {
        formData.value.logo = (res as string).replace(/\\/g, "/");
      })
      .catch(() => {
        showMessage("设置图标失败!", 3000, 2);
      });
  }
};

/** 确认按钮处理逻辑 */
const handleConfirm = async () => {
  if (!formData.value.title || !formData.value.src) {
    showMessage("请完整填写内容!");
    return;
  }
  if (!formData.value.logo) {
    showMessage("请选择图标!");
    return;
  }
  emit("editAppItem", formData.value);
  showModal.value = false;
  formData.value = {
    id: -1,
    title: "",
    src: "",
    logo: "",
  };
};

defineExpose({
  openModal,
});
</script>

<style lang="less">
@import "../../assets/css/variable.less";

.edit-item {
  display: block;
}

.edit-btn-container {
  cursor: pointer;
}

.modal-content {
  background-color: #fff;
  border-radius: 5px;

  display: flex;
  align-items: center;
  flex-direction: column;

  .image {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    width: 48px;
    height: 48px;
    margin: 5px;
    cursor: pointer;
    font-size: 32px;
  }

  .input-container {
    display: flex;
    align-items: center;
    flex-direction: column;

    .input {
      margin: 5px;
      width: 160px;
    }

    .get-icon {
      margin-left: 90px;
      cursor: pointer;
      color: #5264ae;
      font-size: 12px;
      border: 1px solid #5264ae;
      border-radius: 5px;
      padding: 5px;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;

    .button {
      width: 80px;
      margin-top: 10px;
    }
  }
}

.icon-enter-active,
.icon-leave-active {
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
}

.icon-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.icon-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
