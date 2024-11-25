<template>
  <div class="my-plugin">
    <Drawer v-model:visible="popoverRef" position="bottom" style="height: 60%">
      <template #header>
        <div class="flex items-center gap-2">
          <span class="font-bold">常用软件</span>
        </div>
      </template>

      <div class="icons-container">
        <div v-for="item in pluginList" :key="item.windowId" class="icon-wrapper" v-tooltip.bottom="{
          value: item.title,
          showDelay: 200,
          pt: {
            text: {
              style: {
                fontSize: '15px',
              },
            },
          },
        }" @click="handleClick(item)">
          <div class="app-item">
            <i class="icon">
              <img :src="item.icon" :alt="item.title" />
            </i>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { ipcCreateNewWindow } from "@/api/ipc/window.api";
import Drawer from "primevue/drawer";
import { ref } from "vue";
import { appDataDir } from "@tauri-apps/api/path";
import type { PluginConfig } from "@/interface/plugin";
import { getPluginConfig } from "@/utils/plugin";

const popoverRef = ref(false);
const pluginList = ref<PluginConfig[]>([]);

const init = async () => {
  pluginList.value = (await getPluginConfig(["pluginList"])) as PluginConfig[];
};

const handleClick = async (item: PluginConfig) => {
  const appDataPath = await appDataDir();
  const pluginUrl = `http://asset.localhost/${appDataPath}/plugins/${item.windowId}/index.html`;
  ipcCreateNewWindow({
    ...item,
    url: pluginUrl
  });
};

const openPopover = () => {
  init();
  popoverRef.value = true;
};

defineExpose({ openPopover });
</script>

<style lang="less">
@import "../../assets/css/variable.less";

.p-drawer-header {
  padding: 0.2rem 1rem 0 1rem !important;
}

.icons-container {
  display: flex;
  flex-wrap: wrap;
  padding: 1.5rem;
  gap: 1.5rem;
  justify-content: flex-start;
}

.icon-wrapper {
  width: calc(33.33% - 1rem);
  display: flex;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);

    .icon {
      background-color: #e5e7eb;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
}
</style>
