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
          <CustomInput
            v-model="formData.title"
            class="input"
            :label="'网站名称'" />
          <CustomInput
            v-model="formData.url"
            class="input"
            :label="'网站地址'" />
          <transition name="icon">
            <div
              v-if="urlRegex.test(formData.url)"
              class="get-icon"
              @click="getIcon">
              获取图标
            </div>
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
import { WebItem } from "@/interface/web";
import Dialog from "primevue/dialog";
import { ipcGetWebIcon, ipcSetLocalIcon } from "@/api/ipc/launch.api";

const emit = defineEmits(["addWebItem", "editWebItem"]);

/** 网址正则表达式 */
const urlRegex =
  /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6})(?:\/[\w\.\-%]+)*\/?(\?[\w\.\-%]+(?:=[\w\.\-%]+)*)?(?:\&[\w\.\-%]+(?:=[\w\.\-%]+)*)*$/i;

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
    ipcSetLocalIcon(0, filePath)
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
  display: inline-block;
}
.p-overlay-mask {
  border-radius: 20px;
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
