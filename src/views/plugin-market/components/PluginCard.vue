<template>
  <Card class="plugin-card" @click="$emit('click', pluginDetail)">
    <template #header>
      <div class="card-header">
        <Image
          class="plugin-icon"
          :src="pluginDetail.Plugin.Icon || DEFAULT_IMAGE"
          width="64"
          height="64"
          alt="插件图标" />
        <div class="plugin-info">
          <h3
            v-tooltip.bottom="{
              value: pluginDetail.Plugin.Name,
              showDelay: 500,
              pt: {
                text: {
                  style: {
                    fontSize: '15px',
                  },
                },
              },
            }">
            {{ pluginDetail.Plugin.Name }}
          </h3>
          <p>{{ pluginDetail.Plugin.Author }}</p>
        </div>
        <div class="plugin-stats">
          <Rating
            :model-value="pluginDetail.Plugin.Rating"
            :cancel="false"
            readonly
            v-tooltip.bottom="{
              value: `${pluginDetail.Plugin.Rating}分`,
              showDelay: 500,
              pt: {
                text: {
                  style: {
                    fontSize: '15px',
                  },
                },
              },
            }" />
          <div class="downloads">
            {{ formatNumber(pluginDetail.Plugin.Downloads) }}次下载
          </div>
        </div>
      </div>
    </template>
    <template #content>
      <div class="plugin-description">
        {{ pluginDetail.Plugin.Description }}
      </div>
      <div class="card-footer">
        <div class="plugin-tags">
          <Tag
            v-for="tag in safeGetTags().slice(0, 2)"
            :key="tag"
            :value="tag"
            severity="info" />
        </div>
        <template
          v-if="installedPluginIds.includes(pluginDetail.Plugin.WindowId)">
          <Button
            v-if="hasUpdate()"
            icon="pi pi-sync"
            label="有更新"
            severity="info"
            size="small" />
          <Button
            v-else
            icon="pi pi-check"
            label="已安装"
            severity="success"
            size="small"
            disabled />
        </template>
        <Button v-else icon="pi pi-download" label="下载" size="small" />
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import Image from "primevue/image";
import Rating from "primevue/rating";
import Tag from "primevue/tag";
import Button from "primevue/button";
import type { PluginDetail, Plugin } from "@/interface/plugin.d";
import { formatNumber, checkPluginUpdate } from "@/utils/pluginUtils";

interface Props {
  pluginDetail: PluginDetail;
  installedPlugins: Plugin[];
  installedPluginIds: string[];
}

interface Emits {
  (e: "click", pluginDetail: PluginDetail): void;
}

// 常量定义
const DEFAULT_IMAGE = "https://placeholder.co/64";

const props = defineProps<Props>();
defineEmits<Emits>();

// 检查插件是否有更新
const hasUpdate = (): boolean => {
  const installedPlugin = props.installedPlugins.find(
    (p) => p.WindowId === props.pluginDetail.Plugin.WindowId,
  );
  return installedPlugin
    ? checkPluginUpdate(
        installedPlugin.Version,
        props.pluginDetail.Plugin.Version,
      )
    : false;
};

// 安全获取标签数组
const safeGetTags = (): string[] => {
  return props.pluginDetail.Plugin.Tags || [];
};
</script>

<style lang="less" scoped>
.plugin-card {
  height: 270px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    height: 120px;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    padding: 1rem;

    img {
      margin-right: 0.75rem;
    }
  }

  .plugin-icon {
    width: 64px;
    height: 64px;
  }

  .plugin-info {
    margin-left: 1rem;
    flex: 1;

    h3 {
      cursor: pointer;
      font-size: 1.125rem;
      font-weight: 500;
      margin: 0;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100px;
    }

    p {
      color: var(--theme-text-muted);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  }

  .plugin-stats {
    text-align: right;

    .no-rating {
      color: var(--theme-text-muted);
      font-size: 0.875rem;
    }

    .downloads {
      color: var(--theme-text-muted);
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
  }

  .plugin-description {
    height: 60px;
    color: var(--theme-text);
    font-size: 0.875rem;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-footer {
    position: relative;
    bottom: -30px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .plugin-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  }

  :deep(.p-card-body) {
    padding-top: 0;
  }
}

:deep(.p-rating .p-rating-item.p-rating-item-active .p-rating-icon) {
  color: var(--theme-warning);
}
</style>
