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
      :baseZIndex="1004"
      :style="{ width: '235px', minHeight: '200px' }">
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
                isWebMode ? "网站名称" : "软件名称"
              }}</label>
              <InputText
                v-model="formData.title"
                class="input"
                :placeholder="`请输入${isWebMode ? '网站' : '软件'}名称`" />
            </div>
            <div class="input-wrapper">
              <label class="input-label">{{
                isWebMode ? "网站地址" : "软件路径"
              }}</label>
              <InputText
                v-model="formData.path"
                class="input"
                :placeholder="
                  isWebMode ? '请输入网站地址' : '请输入软件路径'
                " />
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
import { ipcSetLocalIcon } from "@/api/ipc/launch.api";
import { SelectItem } from "@/types/common";
import { PathHandler } from "@/utils/pathHandler";
import { ItemTypeEnum } from "@/types/enum";

interface Props {
  mode: ItemTypeEnum;
}

const props = defineProps<Props>();
const emit = defineEmits(["editAppItem", "addWebItem", "editWebItem"]);

const isWebMode = computed(() => props.mode === ItemTypeEnum.Web);

const formData = ref<SelectItem>(PathHandler.createDefaultItem());
const showModal = ref(false);

const modalTitle = computed(() => {
  if (isWebMode.value) {
    return formData.value.id === -1 ? "添加网站" : "编辑网站";
  } else {
    return "编辑软件";
  }
});

const showGetIconButton = computed(() => {
  return (
    !!formData.value.path &&
    (isWebMode.value ? PathHandler.isWebUrl(formData.value.path) : true)
  );
});

const openModal = (item: SelectItem) => {
  formData.value = { ...item };
  showModal.value = true;
};

const closeModal = () => {
  if (formData.value.id !== -1) {
    formData.value = PathHandler.createDefaultItem();
  }
};

const getIcon = () => {
  if (!formData.value.path) {
    showMessage("请输入路径或网址");
    return;
  }
  showLoading();
  PathHandler.getIcon(formData.value.path)
    .then((res) => {
      formData.value.logo = res.replace(/\\/g, "/");
    })
    .catch(() => {
      showMessage("获取图标失败!", 3000, 2);
    })
    .finally(() => {
      hideLoading();
    });
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
    ipcSetLocalIcon(filePath, props.mode)
      .then((res) => {
        formData.value.logo = (res as string).replace(/\\/g, "/");
      })
      .catch(() => {
        showMessage("设置图标失败!", 3000, 2);
      });
  }
};

const handleConfirm = async () => {
  const validation = PathHandler.validateItem(formData.value);
  if (!validation.isValid) {
    showMessage(validation.message!);
    return;
  }

  if (isWebMode.value && PathHandler.isWebUrl(formData.value.path)) {
    formData.value.path = PathHandler.formatUrl(formData.value.path);
    if (formData.value.id === -1) {
      emit("addWebItem", formData.value);
    } else {
      emit("editWebItem", formData.value);
    }
  } else {
    emit("editAppItem", formData.value);
  }

  showModal.value = false;
  formData.value = PathHandler.createDefaultItem();
};

defineExpose({
  openModal,
  closeModal: () => {
    showModal.value = false;
  },
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
