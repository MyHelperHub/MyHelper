<template>
  <div class="my-plugin">
    <Drawer
      v-model:visible="popoverRef"
      position="bottom"
      style="height: 60%"
      class="plugin-drawer">
      <template #header>
        <div class="drawer-header">
          <div class="header-content">
            <i class="pi pi-puzzle-piece header-icon"></i>
            <div class="header-text">
              <span class="header-title">我的插件</span>
              <span class="header-subtitle">{{ enabledCount }} 个已启用</span>
            </div>
          </div>
        </div>
      </template>

      <div class="plugin-container">
        <div v-if="pluginList.length === 0" class="empty-state">
          <i class="pi pi-puzzle-piece"></i>
          <span class="empty-title">暂无已启用的插件</span>
          <span class="empty-subtitle">前往插件市场安装插件</span>
        </div>

        <div v-else class="plugin-grid">
          <div
            v-for="item in pluginList"
            :key="item.windowId"
            class="plugin-card"
            v-tooltip.top="{
              value: item.data.title,
              showDelay: 300,
              pt: {
                text: {
                  style: {
                    fontSize: '12px',
                  },
                },
              },
            }"
            @click="handleClick(item)">
            <div class="plugin-icon-wrapper">
              <img
                :src="item.data.icon"
                :alt="item.data.title"
                class="plugin-icon" />
              <div class="plugin-glow"></div>
            </div>
            <div class="plugin-info">
              <span class="plugin-title">{{ item.data.title }}</span>
            </div>
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
import { showMessage } from "@/utils/message";
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
.my-plugin {
  .plugin-drawer {
    .p-drawer-header {
      padding: 16px 20px 12px !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      background: linear-gradient(
        135deg,
        rgba(79, 109, 245, 0.1),
        rgba(118, 75, 162, 0.1)
      );
      backdrop-filter: blur(10px);
    }

    .drawer-header {
      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #4f6df5, #764ba2);
          color: white;
          border-radius: 8px;
          font-size: 14px;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .header-title {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
          }

          .header-subtitle {
            font-size: 12px;
            color: #718096;
          }
        }
      }
    }

    .p-drawer-content {
      padding: 0 !important;
      background: linear-gradient(
        135deg,
        rgba(245, 247, 250, 0.95),
        rgba(237, 242, 247, 0.95)
      );
      backdrop-filter: blur(20px);
    }
  }

  .plugin-container {
    padding: 20px;
    height: 100%;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 12px;
      color: #9ca3af;

      i {
        font-size: 48px;
        opacity: 0.3;
      }

      .empty-title {
        font-size: 16px;
        font-weight: 600;
        color: #6b7280;
      }

      .empty-subtitle {
        font-size: 14px;
        color: #9ca3af;
      }
    }

    .plugin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 16px;
      align-items: start;

      .plugin-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 12px 8px;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        position: relative;
        overflow: hidden;

        &:hover {
          background: rgba(255, 255, 255, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(79, 109, 245, 0.15);

          .plugin-glow {
            opacity: 0.8;
            transform: scale(1.2);
          }
        }

        &:active {
          transform: translateY(-1px);
        }

        .plugin-icon-wrapper {
          position: relative;
          width: 48px;
          height: 48px;

          .plugin-icon {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 8px;
            position: relative;
            z-index: 2;
          }

          .plugin-glow {
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            background: linear-gradient(135deg, #4f6df5, #764ba2);
            border-radius: 12px;
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1;
          }
        }

        .plugin-info {
          text-align: center;

          .plugin-title {
            font-size: 11px;
            font-weight: 500;
            color: #374151;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }
    }
  }
}
</style>
