<template>
  <div class="add-item">
    <div class="add-btn-container" @click="showModal = true">
      <slot></slot>
    </div>
    <transition name="fade">
      <div class="modal" v-if="showModal" @click.self="showModal = false">
        <div class="modal-container">
          <div class="modal-header">
            添加网站
          </div>
          <div class="modal-body">
            <img class="image" :src="formData.logo ? formData.logo : '../assets/images/add.svg'">
            <div class="input-container">
              <CustomInput class="input" :label="'网站名称'" v-model="formData.title" />
              <CustomInput class="input" :label="'网站地址'" v-model="formData.url" />
            </div>
          </div>
          <div class="modal-footer">
            <CustomButton class="button" @click="handleConfirm" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CustomInput from './CustomInput.vue';
import CustomButton from './CustomButton.vue';
import { invoke } from "@tauri-apps/api/core";


const formData = ref({
  title: '',
  url: '',
  logo: ''
})
const showModal = ref(false);


const handleConfirm = () => {
  // invoke("get_web_icon", { url: formData.value.url }).then((res) => {
  //   console.log(res);
  //   formData.value.logo = res as string;
  // });
  invoke('get_image_base64', { path: 'C:\\Users\\14255\\AppData\\Roaming\\MyHelper\\Image\\WebIcon\\baidu_com.png' })
    .then((res) => {
      // 设置 Base64 数据，前面加上数据类型和编码信息
      formData.value.logo = `data:image/png;base64,${res as string}`;
      console.log(formData.value.logo); // 打印查看 Base64 数据
    })
    .catch((error) => {
      console.error('Error fetching image:', error);
    });
  formData.value = {
    title: '',
    url: '',
    logo: ''
  }
  // showModal.value = false;
}
</script>

<style lang="less" scoped>
.add-item {
  display: inline-block;
}

.add-btn-container {
  cursor: pointer;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.5);

  .modal-container {
    background-color: #fff;
    padding: 15px;
    border-radius: 5px;

    .modal-header {
      font-size: 14px;
      font-weight: bold;
      margin: 0;
      padding: 0;
    }

    .modal-body {
      display: flex;
      align-items: center;
      flex-direction: column;

      .image {
        padding: 5px;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        width: 32px;
        height: 32px;
        margin: 10px;
        cursor: pointer;
      }

      .input-container {
        display: flex;
        align-items: center;
        flex-direction: column;

        .input {
          margin: 5px;
          width: 160px;
        }
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
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>