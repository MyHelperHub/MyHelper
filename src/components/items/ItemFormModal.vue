<template>
  <div class="item-form-modal">
    <div class="form-btn-container" @click="showModal = true">
      <slot></slot>
    </div>

    <Dialog
      v-model:visible="showModal"
      @hide="closeModal"
      :dismissableMask="true"
      :showHeader="false"
      modal
      appendTo="body"
      :closable="false"
      :style="{ width: '280px', minHeight: '200px' }">
      <div class="dialog-wrapper">
        <!-- 添加标题栏 -->
        <div class="modal-header">
          <h3 class="modal-title">{{ modalTitle }}</h3>
        </div>
        <div class="modal-content">
          <img
            v-if="formData.logo"
            class="image"
            :src="convertFileSrc(formData.logo)"
            @click="selectLocalImage" />
          <i v-else class="pi pi-image image" @click="selectLocalImage"></i>
          <div class="input-container">
            <div class="input-wrapper">
              <label class="input-label">{{
                mode === "web" ? "网站名称" : "软件名称"
              }}</label>
              <InputText
                v-model="formData.title"
                class="input"
                :placeholder="`请输入${mode === 'web' ? '网站' : '软件'}名称`" />
            </div>
            <div v-if="mode === 'web'" class="input-wrapper">
              <label class="input-label">网站地址</label>
              <InputText
                v-model="formData.url"
                class="input"
                placeholder="请输入网站地址" />
            </div>
            <transition name="icon">
              <Button
                v-if="showGetIconButton"
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
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { convertFileSrc } from "@tauri-apps/api/core";
import { showMessage } from "@/composables/message.ts";
import { hideLoading, showLoading } from "@/composables/loading.ts";
import { open } from "@tauri-apps/plugin-dialog";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import {
  ipcGetAppIcon,
  ipcGetWebIcon,
  ipcSetLocalIcon,
} from "@/api/ipc/launch.api";
import { SelectItem } from "@/types/common";

interface Props {
  mode: "app" | "web";
}

const props = defineProps<Props>();
const emit = defineEmits([
  "addAppItem",
  "editAppItem",
  "addWebItem",
  "editWebItem",
]);

const urlRegex =
  /^(https?:\/\/)?(((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(\[[0-9a-fA-F:]+\])|(([\w-]+\.)+[a-z]{2,})|localhost)(:\d{1,5})?(\/.*)?$/i;

const formData = ref<SelectItem>({
  id: -1,
  title: "",
  src: "",
  url: "",
  logo: "",
});
const showModal = ref(false);

const modalTitle = computed(() => {
  if (props.mode === "web") {
    return formData.value.id === -1 ? "添加网站" : "编辑网站";
  } else {
    return "编辑软件";
  }
});

const showGetIconButton = computed(() => {
  if (props.mode === "web") {
    return urlRegex.test(String(formData.value.url));
  } else {
    return !!formData.value.src;
  }
});

const openModal = (item: SelectItem) => {
  formData.value = { ...item };
  showModal.value = true;
};

const closeModal = () => {
  if (formData.value.id !== -1) {
    formData.value = {
      id: -1,
      title: "",
      src: "",
      url: "",
      logo: "",
    };
  }
};

const getIcon = () => {
  if (props.mode === "web") {
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
  } else {
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
  }
};

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
    ipcSetLocalIcon(filePath, props.mode === "web" ? 0 : 1)
      .then((res) => {
        formData.value.logo = (res as string).replace(/\\/g, "/");
      })
      .catch(() => {
        showMessage("设置图标失败!", 3000, 2);
      });
  }
};

const handleConfirm = async () => {
  if (props.mode === "web") {
    if (!formData.value.title || !formData.value.url) {
      showMessage("请完整填写内容!");
      return;
    }
    if (!urlRegex.test(formData.value.url)) {
      showMessage("请输入正确的网址格式!");
      return;
    }
    if (!formData.value.logo) {
      showMessage("请选择图标!");
      return;
    }
    if (!/^https?:\/\//i.test(formData.value.url)) {
      formData.value.url = `http://${formData.value.url}`;
    }
    if (formData.value.id === -1) {
      emit("addWebItem", formData.value);
    } else {
      emit("editWebItem", formData.value);
    }
  } else {
    if (!formData.value.title || !formData.value.src) {
      showMessage("请完整填写内容!");
      return;
    }
    if (!formData.value.logo) {
      showMessage("请选择图标!");
      return;
    }
    emit("editAppItem", formData.value);
  }

  showModal.value = false;
  formData.value = {
    id: -1,
    title: "",
    src: "",
    url: "",
    logo: "",
  };
};

defineExpose({
  openModal,
});
</script>

<style lang="less">
@import "@/assets/css/variable.less";

.item-form-modal {
  display: block;
}

.form-btn-container {
  cursor: pointer;
}

.dialog-wrapper {
  padding: 0;
  overflow: hidden;
}

.modal-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(var(--theme-border-rgb), 0.1);

  .modal-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--theme-text);
    margin: 0;
    text-align: center;
  }
}

.modal-content {
  border-radius: 8px;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 0 16px 16px;

  .image {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    border-radius: 8px;
    width: 48px;
    height: 48px;
    margin: 4px;
    cursor: pointer;
    font-size: 24px;
    color: var(--theme-text-muted);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--theme-primary);
      color: var(--theme-primary);
      box-shadow: 0 2px 8px rgba(var(--theme-primary-rgb), 0.3);
    }
  }

  .input-container {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 12px;
    width: 180px;

    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;

      .input-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--theme-text-muted);
      }

      .input {
        width: 100%;
        height: 28px;
        font-size: 12px;
      }
    }

    .get-icon-btn {
      align-self: flex-end;
      font-size: 11px;
      padding: 4px 8px;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: center;
    margin-top: 12px;

    .confirm-button {
      min-width: 60px;
      height: 28px;
      font-size: 12px;
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
