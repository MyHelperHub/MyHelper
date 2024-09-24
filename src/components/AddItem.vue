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
            <img class="image" :src="addItemImage">
            <div class="input-container">
              <CustomInput class="input" :label="'网站名称'" v-model="formData.title" />
              <CustomInput class="input" :label="'网站地址'" v-model="formData.url" />
              <transition name="icon">
                <div v-if="formData.url" class="get-icon" @click="getIcon">获取图标</div>
              </transition>
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
import { getImageByTauri } from '../utils/getImages';
import CustomInput from './CustomInput.vue';
import CustomButton from './CustomButton.vue';
import { invoke,convertFileSrc  } from "@tauri-apps/api/core";
import { configDir, join, resolve } from '@tauri-apps/api/path';


const formData = ref({
  title: '',
  url: '',
  logo: ''
})
const addItemImage = ref<string>()
const showModal = ref(false);


// 获取图标方法
const getIcon = () => {
  if (!formData.value.url) {
    console.log("请输入网站地址");
    return;
  }
  
  // 这里应该会获取 formData.logo 中的图片，并且你可以使用 convertFileSrc 来展示图片
  if (formData.value.logo) {
    addItemImage.value = convertFileSrc(formData.value.logo);
  }
}

// 确认按钮处理逻辑
const handleConfirm = async () => {
  const configPath = await configDir(); // 获取配置目录
  const myHelperPath = await join(configPath, 'myhelper'); // 拼接 myhelper 路径
  const imagePath = `${myHelperPath}/Image/WebIcon/baidu_com.png`; // 完整路径

  // 使用 convertFileSrc 将本地路径转换为可显示的文件 URL
  addItemImage.value = convertFileSrc(imagePath);

  // 如果你有其他逻辑需要处理，可以在这里添加
  console.log('图片路径：', addItemImage.value);
};
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

.icon-enter-active,
.icon-leave-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
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