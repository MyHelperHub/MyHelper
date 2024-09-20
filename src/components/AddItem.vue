<template>
    <div class="add-item">
      <div class="add-btn-container" @click="showModal = true">
        <slot></slot> 
      </div>
      <transition name="fade">
        <div class="modal" v-if="showModal" @click.self="showModal = false">
          <div class="modal-content">
            123123
          </div>
        </div>
      </transition>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  
  const showModal = ref(false);
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
  
    .modal-content {
      background-color: #fff;
      padding: 20px;
      border-radius: 5px;
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
  