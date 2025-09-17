<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :style="{ width: '50vw' }"
    :header="selectedPlugin?.Name"
    class="plugin-detail-dialog"
    dismissableMask
    @update:visible="$emit('update:visible', $event)">
    <div class="plugin-detail" v-if="selectedPlugin">
      <!-- 插件头部信息 -->
      <div class="plugin-header">
        <Image
          :src="selectedPlugin.Icon"
          :alt="selectedPlugin.Name"
          width="64"
          height="64" />
        <div class="plugin-info">
          <p class="author">作者：{{ selectedPlugin.Author }}</p>
          <div class="stats" v-if="!isPluginInstalled">
            <div class="rating-wrapper">
              <Rating
                :modelValue="selectedPlugin.Rating"
                :cancel="false"
                readonly />
            </div>
            <span class="downloads"
              >{{ formatNumber(selectedPlugin.Downloads) }}次下载</span
            >
          </div>
          <div class="stats" v-else>
            <div class="rating-wrapper">
              <Rating
                :model-value="userRating"
                :cancel="false"
                :readonly="selectedPluginIsRated || selectedPlugin.Id === -1"
                @update:model-value="$emit('rating-change', { value: $event })"
                v-tooltip.bottom="{
                  value: `${userRating}分`,
                  showDelay: 500,
                  pt: {
                    text: {
                      style: {
                        fontSize: '15px',
                      },
                    },
                  },
                }" />
              <span
                class="rating-hint"
                v-if="
                  !selectedPluginIsRated &&
                  userData?.Token &&
                  installedPluginIds.includes(selectedPlugin?.WindowId || '') &&
                  selectedPlugin.Id !== -1
                ">
                点击星星进行评分
              </span>
              <span class="rating-hint" v-else-if="selectedPluginIsRated">
                您已评分
              </span>
              <span class="rating-hint" v-else-if="selectedPlugin.Id === -1">
                本地插件不可评分
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 插件标签 -->
      <div class="plugin-tags">
        <Tag
          v-for="tag in selectedPlugin.Tags"
          :key="tag"
          :value="tag"
          severity="info" />
      </div>

      <!-- 插件详细描述 -->
      <div class="description">
        <h3>插件描述</h3>
        <p>{{ selectedPlugin.Description }}</p>
      </div>

      <!-- 插件截图 -->
      <div class="screenshots" v-if="selectedPlugin.Screenshots?.length">
        <h3>插件截图</h3>
        <Carousel
          :value="selectedPlugin.Screenshots"
          :numVisible="1"
          :numScroll="1"
          :circular="true"
          :showIndicators="true"
          :showNavigators="true"
          class="screenshot-carousel">
          <template #item="slotProps">
            <div class="screenshot-container">
              <Image
                :src="slotProps.data"
                alt="screenshot"
                preview
                imageClass="screenshot-image" />
            </div>
          </template>
        </Carousel>
      </div>

      <!-- 版本信息 -->
      <div class="version-info">
        <h3>版本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <i class="pi pi-tag"></i>
            <div class="info-content">
              <span class="label">当前版本</span>
              <span class="value">
                <template v-if="isPluginInstalled">
                  {{ installedVersion }}
                  <template v-if="hasUpdate">
                    <span class="latest-version"
                      >(最新版本: {{ selectedPlugin?.Version }})</span
                    >
                  </template>
                </template>
                <template v-else>
                  {{ selectedPlugin?.Version }}
                </template>
              </span>
            </div>
          </div>
          <div class="info-item">
            <i class="pi pi-clock"></i>
            <div class="info-content">
              <span class="label">创建时间</span>
              <span class="value">{{
                formatDate(selectedPlugin.CreateTime, true)
              }}</span>
            </div>
          </div>
          <div class="info-item">
            <i class="pi pi-refresh"></i>
            <div class="info-content">
              <span class="label">更新时间</span>
              <span class="value">{{
                formatDate(selectedPlugin.UpdateTime, true)
              }}</span>
            </div>
          </div>
          <div
            class="info-item"
            v-if="
              isPluginInstalled &&
              selectedPlugin.installTime &&
              formatDate(selectedPlugin.installTime, true)
            ">
            <i class="pi pi-download"></i>
            <div class="info-content">
              <span class="label">安装时间</span>
              <span class="value">{{
                formatDate(selectedPlugin.installTime, true)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button label="取消" class="p-button-text" @click="$emit('close')" />
        <template v-if="isPluginInstalled">
          <Button
            v-if="hasUpdateComputed"
            label="更新"
            icon="pi pi-sync"
            severity="info"
            @click="$emit('download', selectedPlugin, true)" />
          <Button
            v-else
            label="已安装"
            icon="pi pi-check"
            severity="success"
            disabled />
        </template>
        <Button
          v-else
          label="下载"
          severity="primary"
          @click="$emit('download', selectedPlugin, false)" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Dialog from "primevue/dialog";
import Image from "primevue/image";
import Rating from "primevue/rating";
import Tag from "primevue/tag";
import Carousel from "primevue/carousel";
import Button from "primevue/button";
import type { Plugin } from "@/interface/plugin.d";
import {
  formatNumber,
  formatDate,
  checkPluginUpdate,
} from "@/utils/pluginUtils";

type Props = {
  visible: boolean;
  selectedPlugin: Plugin | null;
  selectedPluginIsRated: boolean;
  userRating: number;
  userData: { Token?: string } | null;
  installedPluginIds: string[];
  installedPlugins: Plugin[];
  hasUpdate: boolean;
}

type Emits = {
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
  (e: "download", plugin: Plugin | null, isUpdate: boolean): void;
  (e: "rating-change", event: { value: number }): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

// 计算属性：是否已安装
const isPluginInstalled = computed(() => {
  if (!props.selectedPlugin) return false;
  return props.installedPluginIds.includes(props.selectedPlugin.WindowId);
});

// 计算属性：已安装版本
const installedVersion = computed(() => {
  if (!props.selectedPlugin) return "";
  const installedPlugin = props.installedPlugins.find(
    (p) => p.WindowId === props.selectedPlugin?.WindowId,
  );
  return installedPlugin?.Version || "";
});

// 计算属性：是否有更新
const hasUpdateComputed = computed(() => {
  if (
    !isPluginInstalled.value ||
    !installedVersion.value ||
    !props.selectedPlugin?.Version
  ) {
    return false;
  }
  return checkPluginUpdate(
    installedVersion.value,
    props.selectedPlugin.Version,
  );
});
</script>

<style lang="less">
.plugin-detail-dialog {
  :deep(.p-dialog-content) {
    padding: 0 1.5rem 1.5rem 1.5rem;
  }

  .plugin-detail {
    .plugin-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;

      .plugin-info {
        margin-left: 20px;
        flex: 1;

        .author {
          color: var(--theme-text-muted);
          margin: 5px 0;
        }

        .stats {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-top: 10px;

          .rating-wrapper {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .rating-hint {
              color: var(--theme-text-muted);
              font-size: 0.75rem;
            }

            :deep(.p-rating) {
              .p-rating-item {
                cursor: pointer;

                &:hover {
                  transform: scale(1.1);
                }

                &.p-rating-item-active .p-rating-icon {
                  color: var(--theme-warning);
                }
              }
            }
          }

          .downloads {
            color: var(--theme-text-muted);
          }
        }
      }
    }

    .plugin-tags {
      margin-bottom: 20px;
      display: flex;
      gap: 8px;
    }

    .description {
      margin-bottom: 30px;

      h3 {
        margin-bottom: 10px;
      }

      p {
        white-space: pre-line;
        line-height: 1.6;
        color: var(--theme-text);
      }
    }

    .screenshots {
      margin-bottom: 30px;

      h3 {
        margin-bottom: 15px;
      }

      .screenshot-carousel {
        :deep(.p-carousel-container) {
          padding: 0 2rem;
        }

        :deep(.p-carousel-content) {
          height: 300px;
        }

        :deep(.p-carousel-indicators) {
          margin-top: 1rem;
        }
      }

      .screenshot-container {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;

        :deep(.screenshot-image) {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          cursor: pointer;
          transition: transform 0.2s;

          &:hover {
            transform: scale(1.02);
          }
        }
      }
    }

    .version-info {
      margin-bottom: 20px;
      background-color: rgba(
        var(--theme-background-card-rgb),
        var(--theme-transparency-card)
      );
      border-radius: 8px;
      padding: 1.5rem;

      h3 {
        margin-bottom: 1.5rem;
        color: var(--theme-text);
        font-size: 1.1rem;
        font-weight: 600;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;

        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;

          i {
            font-size: 1.2rem;
            color: var(--theme-primary);
            margin-top: 3px;
          }

          .info-content {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .label {
              color: var(--theme-text-muted);
              font-size: 0.875rem;
            }

            .value {
              color: var(--theme-text);
              font-weight: 500;

              .latest-version {
                color: var(--theme-primary);
                font-size: 0.875rem;
                margin-left: 0.5rem;
                font-weight: normal;
              }
            }
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 1.5rem;

    :deep(.p-button) {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;

      .p-button-icon {
        font-size: 0.875rem;
      }
    }
  }
}

:deep(.p-image-mask) {
  background-color: rgba(var(--theme-background-card-rgb), 0.9);
}

:deep(.p-rating .p-rating-item.p-rating-item-active .p-rating-icon) {
  color: var(--theme-warning);
}
</style>
