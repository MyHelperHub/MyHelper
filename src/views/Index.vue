<template>
  <div class="top-container">
    <div class="brand">
      <img class="logo" src="/logo.png" @click="showMenu" />
    </div>
  </div>
  <Transition name="transition">
    <div v-show="isShowMenu" class="home">
      <div class="settings">
        <SpeedDial
          class="speed-dial"
          button-class="speed-dial-button"
          show-icon="pi pi-bars"
          hide-icon="pi pi-times"
          :model="items"
          :radius="65"
          type="quarter-circle"
          direction="down-left" />
      </div>
      <Search class="search" />
      <span class="parting-line"></span>
      <Menu></Menu>
    </div>
  </Transition>
</template>
<script setup lang="ts">
import SpeedDial from "primevue/speeddial";
import { hideMessage } from "@/utils/message";
import Search from "@/views/Search.vue";
import Menu from "./Menu.vue";
import { invoke } from "@tauri-apps/api/core";
import { ref } from "vue";

const isShowMenu = ref(false);

const items = ref([
  {
    label: "Add",
    icon: "pi pi-pencil",
    command: () => {
      console.log(123123);
    },
  },
  {
    label: "Add",
    icon: "pi pi-pencil",
    command: () => {
      console.log(123123);
    },
  },
  {
    label: "Add",
    icon: "pi pi-pencil",
    command: () => {
      console.log(123123);
    },
  },
]);

const showMenu = () => {
  hideMessage();
  const [width, height] = isShowMenu.value ? [65, 65] : [250, 420];
  invoke("set_window_size", { width, height });
  isShowMenu.value = !isShowMenu.value;
};
</script>
<style lang="less">
.home {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(230, 235, 240, 0.7);
  border-radius: 20px;
  background: linear-gradient(#e5edf1, #9fc0cf);
  list-style-type: none;
  -webkit-font-smoothing: antialiased;
  .parting-line {
    position: absolute;
    top: 65px;
    width: 100%;
    margin-left: -1px;
    border: none;
    border-top: 1px solid rgba(58, 69, 80, 0.2);
  }
  .search {
    position: relative;
    top: 72px;
  }
  .settings {
    position: absolute;
    right: 0;
    top: 10px;
    .speed-dial {
      .p-button-rounded{
        width: 30px;
        height: 30px;
      }
    }
    .speed-dial-button{
      background-color: rgb(168, 165, 165);
      border-color:rgb(168, 165, 165) ;
    }
  }
}
.brand {
  width: fit-content;
  height: fit-content;
  cursor: pointer;

  .logo {
    position: absolute;
    left: 3px;
    top: 3px;
    height: 60px;
    width: 60px;
    border-radius: 50%;
    border: 4px solid rgba(230, 235, 240, 0.8);
    z-index: 1;
    // 禁止拖动
    -webkit-user-drag: none;
  }
}

.transition-enter-from,
.transition-leave-to {
  opacity: 0;
}

.transition-enter-to,
.transition-leave-from {
  opacity: 1;
}

.transition-enter-active,
.transition-leave-active {
  transition: opacity 0.5s ease-in-out;
}
</style>
