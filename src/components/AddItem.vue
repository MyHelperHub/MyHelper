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
            <img class="image" src="../assets/images/defaultImage.svg">
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


const formData = ref({
  title: '',
  url: '',
  logo: ''
})
const showModal = ref(false);

const handleConfirm = () => {
  console.log(formData.value);

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
        width: 32px;
        height: 32px;
        margin: 10px;
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