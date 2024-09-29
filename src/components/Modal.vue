<template>
    <transition name="fade">
      <div class="modal" v-if="modelValue" @click.self="handleClose">
        <div class="modal-container">
          <slot></slot>
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
  
  const emit = defineEmits(["update:modelValue", "close"]); 
  
  // @ts-ignore
  const props = defineProps({
    modelValue: {
      type: Boolean,
      default: false,
    },
  });
  
  const handleClose = () => {
    emit("update:modelValue", false);
    emit("close"); 
  };
  </script>
  
  <style scoped lang="less">
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
    z-index: 1000;
  
    .modal-container {
      background-color: #fff;
      padding: 15px;
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