<template>
  <div class="add-item">
    <div class="add-btn-container" @click="showModal = true">
      <slot></slot>
    </div>

    <Dialog
      v-model:visible="showModal"
      @hide="closeModal"
      :dismissableMask="true"
      :header="formData.id === -1 ? '添加网站' : '编辑网站'"
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
          <div class="input-wrapper">
            <label class="input-label">网站名称</label>
            <InputText
              v-model="formData.title"
              class="input"
              placeholder="请输入网站名称" />
          </div>
          <div class="input-wrapper">
            <label class="input-label">网站地址</label>
            <InputText
              v-model="formData.url"
              class="input"
              placeholder="请输入网站地址" />
          </div>
          <transition name="icon">
            <Button
              v-if="urlRegex.test(formData.url)"
              class="get-icon-btn"
              @click="getIcon"
              text
              size="small">
              获取图标
            </Button>
          </transition>
        </div>
        <div class="modal-footer">
          <Button
            class="confirm-button"
            @click="handleConfirm"
            label="确定"
            severity="info" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { showMessage } from "@/utils/message.ts";
import { hideLoading, showLoading } from "@/utils/loading.ts";
import { open } from "@tauri-apps/plugin-dialog";
import { WebItem } from "@/interface/web";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import { ipcGetWebIcon, ipcSetLocalIcon } from "@/api/ipc/launch.api";

const emit = defineEmits(["addWebItem", "editWebItem"]);

/** URL正则表达式 */
const urlRegex =
  /^(https?:\/\/)?(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(\[[0-9a-fA-F:]+\])|(([\w-]+\.)+[a-z]{2,})|localhost)(:\d{1,5})?(\/.*)?$/i;

const formData = ref<WebItem>({
  /** -1时为编辑 */
  id: -1,
  title: "",
  url: "",
  logo: "",
});
const showModal = ref(false);

/** 打开AddItem弹窗 */
const openModal = (item: WebItem) => {
  formData.value = item;
  showModal.value = true;
};

const closeModal = () => {
  if (formData.value.id !== -1) {
    formData.value = {
      id: -1,
      title: "",
      url: "",
      logo: "",
    };
  }
};
/** 获取图标方法 */
const getIcon = () => {
  if (!formData.value.url) {
    showMessage("请输入网站地址");
    return;
  }
  showLoading();
  ipcGetWebIcon(formData.value.url)
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
    ipcSetLocalIcon(filePath, 0)
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
  if (!formData.value.title || !formData.value.url) {
    showMessage("请完整填写内容!");
    return;
  }
  // 校验网址格式
  if (!urlRegex.test(formData.value.url)) {
    showMessage("请输入正确的网址格式!");
    return;
  }
  if (!formData.value.logo) {
    showMessage("请选择图标!");
    return;
  }
  // 检查 URL 是否以 http:// 或 https:// 开头
  if (!/^https?:\/\//i.test(formData.value.url)) {
    formData.value.url = `http://${formData.value.url}`; // 默认添加 http://
  }
  // formData.value.id为-1时为新增
  if (formData.value.id === -1) {
    emit("addWebItem", formData.value);
  } else {
    emit("editWebItem", formData.value);
  }
  showModal.value = false;
  formData.value = {
    id: -1,
    title: "",
    url: "",
    logo: "",
  };
};

defineExpose({
  openModal,
});
</script>

<style lang="less">
@import "../../assets/css/variable.less";

.add-item {
  display: block;
}

.add-btn-container {
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
    gap: 16px;
    width: 200px;

    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;

      .input-label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }

      .input {
        width: 100%;
        height: 32px;
        font-size: 14px;
      }
    }

    .get-icon-btn {
      align-self: flex-end;
      font-size: 12px;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    margin-top: 20px;

    .confirm-button {
      min-width: 80px;
      height: 32px;
      font-size: 14px;
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
