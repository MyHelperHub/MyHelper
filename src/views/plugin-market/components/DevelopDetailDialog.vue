<template>
  <Dialog
    :visible="visible"
    :header="activeMenu === MenuKey.UploadHistory ? '上传记录详情' : '插件详情'"
    :modal="true"
    class="w-[700px]"
    dismissableMask
    @update:visible="$emit('update:visible', $event)">
    <div class="p-6" v-if="selectedPlugin">
      <div class="space-y-4">
        <!-- 插件头部信息 -->
        <div
          class="flex items-center justify-between pb-4 border-bottom-1 surface-border">
          <div class="flex items-center gap-3">
            <Image
              v-if="activeMenu !== MenuKey.UploadHistory"
              :src="selectedPlugin.Icon || 'https://placeholder.co/48'"
              width="48"
              height="48" />
            <div>
              <h3 class="text-xl font-semibold">{{ selectedPlugin.Name }}</h3>
              <p class="text-sm text-gray-600">
                版本：{{ selectedPlugin.Version }}
              </p>
            </div>
          </div>
          <Tag
            v-if="selectedPlugin.Status !== undefined"
            :value="statusMap[selectedPlugin.Status]"
            :severity="getStatusSeverity(selectedPlugin.Status)" />
        </div>

        <!-- 上传记录特有信息 -->
        <template v-if="activeMenu === MenuKey.UploadHistory">
          <div>
            <label class="text-sm text-gray-600">上传时间</label>
            <p class="mt-1">{{ selectedPlugin.CreateTime }}</p>
          </div>
          <div v-if="selectedPlugin.Message">
            <label class="text-sm text-gray-600">审核消息</label>
            <p
              class="mt-1"
              :class="{ 'text-red-500': selectedPlugin.Status === 2 }">
              {{ selectedPlugin.Message }}
            </p>
          </div>
        </template>

        <!-- 插件详情特有信息 -->
        <template v-else>
          <!-- 插件统计信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div v-if="selectedPlugin.Downloads !== undefined">
              <label class="text-sm text-gray-600">下载次数</label>
              <p class="mt-1">{{ formatNumber(selectedPlugin.Downloads) }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-600">创建时间</label>
              <p class="mt-1">{{ selectedPlugin.CreateTime }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-600">更新时间</label>
              <p class="mt-1">{{ selectedPlugin.UpdateTime }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-600">评分</label>
              <div class="mt-1 flex items-center gap-2">
                <Rating
                  :modelValue="selectedPlugin.Rating || 0"
                  :cancel="false"
                  readonly />
                <span class="text-sm text-gray-600">{{
                  selectedPlugin.Rating || "暂无评分"
                }}</span>
              </div>
            </div>
            <div v-if="selectedPlugin.Category !== undefined">
              <label class="text-sm text-gray-600">分类</label>
              <p class="mt-1">
                {{ getCategoryName(selectedPlugin.Category) }}
              </p>
            </div>
          </div>

          <!-- 插件标签 -->
          <div v-if="selectedPlugin.Tags?.length">
            <label class="text-sm text-gray-600">标签</label>
            <div class="mt-2 flex flex-wrap gap-2">
              <Tag
                v-for="tag in selectedPlugin.Tags"
                :key="tag"
                :value="tag"
                severity="info" />
            </div>
          </div>

          <!-- 插件描述 -->
          <div v-if="selectedPlugin.Description">
            <label class="text-sm text-gray-600">描述</label>
            <p class="mt-1 text-gray-700 whitespace-pre-line">
              {{ selectedPlugin.Description }}
            </p>
          </div>

          <!-- 截图预览 -->
          <div
            v-if="selectedPlugin.Screenshots?.length"
            class="screenshot-carousel-container">
            <label class="text-sm text-gray-600">截图预览</label>
            <div class="mt-2 carousel-wrapper">
              <Carousel
                :value="selectedPlugin.Screenshots"
                :numVisible="1"
                :numScroll="1"
                :circular="selectedPlugin.Screenshots.length > 1"
                :showIndicators="selectedPlugin.Screenshots.length > 1"
                :showNavigators="selectedPlugin.Screenshots.length > 1"
                class="custom-carousel">
                <template #item="slotProps">
                  <div class="carousel-item">
                    <Image
                      :src="slotProps.data"
                      alt="screenshot"
                      preview
                      imageClass="carousel-image" />
                  </div>
                </template>
              </Carousel>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from "primevue/dialog";
import Image from "primevue/image";
import { MenuKey } from "@/interface/pluginMarket.d";
import Tag from "primevue/tag";
import Rating from "primevue/rating";
import Carousel from "primevue/carousel";
import type { DeveloperPlugin } from "@/interface/pluginMarket.d";
import { STATUS_MAP, STATUS_SEVERITY_MAP } from "@/interface/pluginMarket.d";
import { PluginCategory } from "@/interface/plugin.d";

interface Props {
  visible: boolean;
  selectedPlugin: DeveloperPlugin | null;
  activeMenu: MenuKey;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
}

defineProps<Props>();
defineEmits<Emits>();

const statusMap = STATUS_MAP;

const getStatusSeverity = (status: number) => {
  return STATUS_SEVERITY_MAP[status] || "info";
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

const categoryOptions = [
  { label: "开发工具", value: PluginCategory.DEVELOPMENT },
  { label: "效率工具", value: PluginCategory.EFFICIENCY },
  { label: "网络工具", value: PluginCategory.NETWORK },
  { label: "系统工具", value: PluginCategory.SYSTEM },
  { label: "娱乐工具", value: PluginCategory.ENTERTAINMENT },
  { label: "其他", value: PluginCategory.OTHER },
];

const getCategoryName = (category: number | undefined) => {
  const categoryOption = categoryOptions.find((c) => c.value === category);
  return categoryOption?.label || "未知分类";
};
</script>

<style lang="less" scoped>
.screenshot-carousel-container {
  .carousel-wrapper {
    position: relative;
    margin: 0 -1rem;

    :deep(.custom-carousel) {
      .p-carousel-container {
        position: relative;
        padding: 0 3rem;
      }

      .carousel-item {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 400px;
        padding: 1rem;

        .p-image {
          width: 100%;
          height: 100%;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
        }
      }

      .p-carousel-prev,
      .p-carousel-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 3rem;
        height: 3rem;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        margin: 0;

        &:enabled:hover {
          background: rgba(255, 255, 255, 1);
        }
      }

      .p-carousel-prev {
        left: 0;
      }

      .p-carousel-next {
        right: 0;
      }

      .p-carousel-indicators {
        margin-top: 1rem;

        .p-carousel-indicator {
          button {
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 50%;
            background: rgba(var(--theme-border-rgb), var(--theme-transparency-border));

            &.p-highlight {
              background: var(--theme-primary);
            }
          }
        }
      }
    }
  }
}

:deep(.carousel-image) {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: cover;
}
</style>
