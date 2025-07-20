<template>
  <div class="my-plugin">
    <Drawer v-model:visible="popoverRef" position="bottom" style="height: 60%">
      <template #header>
        <div class="header-content">
          <span class="header-title">我的插件</span>
          <span class="header-subtitle">{{ enabledCount }} 个已启用</span>
        </div>
      </template>

      <div class="icons-container">
        <div
          v-for="item in pluginList"
          :key="item.windowId"
          class="icon-wrapper"
          v-tooltip.bottom="{
            value: item.data.title,
            showDelay: 200,
            pt: {
              text: {
                style: {
                  fontSize: '15px',
                },
              },
            },
          }"
          @click="handleClick(item)">
          <div class="app-item">
            <i class="icon">
              <img :src="item.data.icon" :alt="item.data.title" loading="lazy" />
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
import { computed, ref } from "vue";
import type { PluginConfig } from "@/interface/plugin";
import { getPluginConfig } from "@/utils/plugin";
import { showMessage } from "@/composables/message.ts";
import { ipcFileExists } from "@/api/ipc/launch.api";

const popoverRef = ref(false);
const pluginList = ref<PluginConfig[]>([]);

const enabledCount = computed(() => pluginList.value.length);

const init = async () => {
  const allPlugins = (await getPluginConfig(["pluginList"])) as PluginConfig[];
  // 只显示已启用的插件
  pluginList.value = allPlugins.filter(
    (plugin) => plugin.config?.isEnabled === true,
  );
};

const handleClick = async (item: PluginConfig) => {
  try {
    // 检查插件状态
    if (!item.config?.isEnabled) {
      showMessage("插件已禁用，请先启用后再使用", 3000, 2);
      return;
    }

    // 检查插件的 index.html 文件是否存在
    const exists = await ipcFileExists(item.data.url);

    if (!exists) {
      showMessage("插件文件不存在，请重新安装插件", 3000, 2);
      return;
    }
    // 实际路径
    const realPath = `http://asset.localhost/${item.data.url}`;
    const success = await ipcCreateNewWindow({
      ...item.data,
      url: realPath,
    });

    if (!success) {
      showMessage("打开插件失败", 3000, 2);
    }
  } catch (error) {
    showMessage("打开插件失败", 3000, 2);
  }
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
  padding: 1rem 1rem 0.5rem 1rem !important;
  border-bottom: 1px solid var(--theme-border) !important;
  background: var(--theme-background-card) !important;
}

.p-drawer-content {
  background: var(--theme-background-card) !important;
  padding: 0 !important;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--theme-text) !important;
  }

  .header-subtitle {
    font-size: 12px;
    color: var(--theme-text-muted) !important;
  }
}

.icons-container {
  display: flex;
  flex-wrap: wrap;
  padding: 1.5rem;
  gap: 1.5rem;
  justify-content: flex-start;
  background: var(--theme-background-card) !important;
}

.icon-wrapper {
  width: calc(33.33% - 1rem);
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);

    .icon {
      background-color: rgba(var(--theme-background-rgb), 0.9) !important;
      box-shadow: var(--theme-shadow-md) !important;
      border: 1px solid rgba(var(--theme-primary-rgb), 0.3) !important;
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
  background-color: rgba(var(--theme-background-rgb), 0.7) !important;
  border: 1px solid var(--theme-border) !important;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  img {
    width: 36px;
    height: 36px;
    object-fit: contain;
    border-radius: 8px;
  }
}
</style>
