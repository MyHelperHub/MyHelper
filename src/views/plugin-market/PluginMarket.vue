<template>
  <div class="plugin-market">
    <!-- 顶部搜索和过滤区域 -->
    <div class="search-area">
      <div class="container">
        <div class="search-wrapper">
          <div class="search-input">
            <InputText v-model="searchQuery" placeholder="搜索插件..." />
            <Button 
              class="search-button"
              icon="pi pi-search"
              @click="handleSearch" />
          </div>
          <Button icon="pi pi-upload" label="上传插件" />
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="container main-content">
      <div class="content-wrapper">
        <!-- 左侧分类菜单 -->
        <div class="category-menu">
          <Card class="menu-card">
            <template #title>
              <div class="card-title">插件分类</div>
            </template>
            <template #content>
              <div class="menu-wrapper">
                <Menu :model="categoryMenuItems" />
              </div>
            </template>
          </Card>
        </div>

        <!-- 右侧插件列表 -->
        <div class="plugin-list">
          <!-- 排序和筛选工具栏 -->
          <Toolbar class="toolbar">
            <template #start>
              <Select
                v-model="currentSort"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                class="sort-select"
                placeholder="排序方式"
                :panelStyle="{ width: '200px' }" />
            </template>
            <template #end>
              <Select
                v-model="timeFilter"
                :options="timeFilterOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="选择时间范围"
                class="time-filter-select"
                :panelStyle="{ width: '200px' }" />
            </template>
          </Toolbar>

          <!-- 插件网格 -->
          <div class="plugin-grid">
            <Card
              v-for="plugin in plugins"
              :key="plugin.id"
              class="plugin-card">
              <template #header>
                <div class="card-header">
                  <Image
                    :src="plugin.icon"
                    :alt="plugin.name"
                    width="48"
                    height="48" />
                  <div class="plugin-info">
                    <h3>{{ plugin.name }}</h3>
                    <p>{{ plugin.author }}</p>
                  </div>
                  <div class="plugin-stats">
                    <Rating v-model="plugin.rating" :cancel="false" readonly />
                    <div class="downloads">
                      {{ formatNumber(plugin.downloads) }}次下载
                    </div>
                  </div>
                </div>
              </template>
              <template #content>
                <p class="plugin-description">
                  {{ plugin.description }}
                </p>
                <div class="card-footer">
                  <div class="plugin-tags">
                    <Tag
                      v-for="tag in plugin.tags"
                      :key="tag"
                      :value="tag"
                      severity="info" />
                  </div>
                  <Button icon="pi pi-download" label="下载" size="small" />
                </div>
              </template>
            </Card>
          </div>

          <!-- 分页 -->
          <div class="pagination">
            <Paginator
              v-model:first="first"
              :rows="9"
              :total-records="total"
              :rows-per-page-options="[9, 18, 27]" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Card from "primevue/card";
import Menu from "primevue/menu";
import Toolbar from "primevue/toolbar";
import Select from "primevue/select";
import Image from "primevue/image";
import Rating from "primevue/rating";
import Tag from "primevue/tag";
import Paginator from "primevue/paginator";

// 接口定义
interface Plugin {
  id: number;
  name: string;
  author: string;
  icon: string;
  description: string;
  rating: number;
  downloads: number;
  tags: string[];
}

// 状态定义
const searchQuery = ref("");
const selectedCategory = ref(1);
const currentSort = ref("downloads");
const timeFilter = ref("all");
const first = ref(0);
const total = ref(100);

// 分类菜单项
const categoryMenuItems = ref([
  {
    label: "全部插件",
    icon: "pi pi-list",
    command: () => selectCategory(1),
    badge: "1234",
  },
  {
    label: "开发工具",
    icon: "pi pi-code",
    command: () => selectCategory(2),
    badge: "328",
  },
  {
    label: "效率工具",
    icon: "pi pi-clock",
    command: () => selectCategory(3),
    badge: "246",
  },
  {
    label: "网络工具",
    icon: "pi pi-wifi",
    command: () => selectCategory(4),
    badge: "185",
  },
  {
    label: "系统工具",
    icon: "pi pi-desktop",
    command: () => selectCategory(5),
    badge: "142",
  },
  {
    label: "娱乐工具",
    icon: "pi pi-play",
    command: () => selectCategory(6),
    badge: "98",
  },
]);

// 排序选项
const sortOptions = ref([
  { label: "下载量", value: "downloads" },
  { label: "好评数", value: "rating" },
  { label: "最新", value: "latest" },
]);

// 时间筛选选项
const timeFilterOptions = ref([
  { label: "所有时间", value: "all" },
  { label: "最近一周", value: "week" },
  { label: "最近一月", value: "month" },
  { label: "最近一年", value: "year" },
]);

// 模拟插件数据
const plugins = ref<Plugin[]>([
  {
    id: 1,
    name: "代码格式化工具",
    author: "JohnDoe",
    icon: "https://placeholder.co/48",
    description:
      "一个强大的代码格式化工具，支持多种编程语言，可自定义格式化规则。",
    rating: 4.8,
    downloads: 12580,
    tags: ["开发工具", "VSCode"],
  },
  {
    id: 2,
    name: "截图工具Pro",
    author: "Jane Smith",
    icon: "https://placeholder.co/48",
    description:
      "专业的屏幕截图工具，支持区域截图、滚动截图、OCR文字识别等功能。",
    rating: 4.9,
    downloads: 45678,
    tags: ["效率工具", "截图"],
  },
  {
    id: 3,
    name: "网络测速大师",
    author: "NetMaster",
    icon: "https://placeholder.co/48",
    description: "准确测试网络速度，支持多节点测速，网络延迟测试等功能。",
    rating: 4.7,
    downloads: 34567,
    tags: ["网络工具", "测速"],
  },
]);

// 方法定义
const selectCategory = (id: number) => {
  selectedCategory.value = id;
  // 这里可以添加获取分类插件的逻辑
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("zh-CN").format(num);
};

// 搜索方法
const handleSearch = () => {
  // 这里实现搜索逻辑
  console.log("执行搜索:", searchQuery.value);
};
</script>

<style lang="less" scoped>
.plugin-market {
  min-height: 100vh;
  background-color: #f8f9fa;

  .search-area {
    background-color: #f3f4f6;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 0;

    .container {
      max-width: 80rem;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .search-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .search-input {
      position: relative;
      flex: 1;
      max-width: 36rem;

      .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
        z-index: 1;
      }

      :deep(.p-inputtext) {
        width: 100%;
        padding-right: 3rem;
      }

      .search-button {
        position: absolute;
        right: 0.25rem;
        top: 50%;
        transform: translateY(-50%);
        padding: 0.5rem;
        border: none;
        background-color: transparent;
        color: #6b7280;

        &:hover {
          color: #1a73e8;
          background-color: #f3f4f6;
        }

        &:focus {
          box-shadow: none;
        }
      }
    }
  }

  .container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  .content-wrapper {
    display: flex;
    gap: 1.5rem;
  }

  .category-menu {
    width: 12rem;
    flex: none;

    .menu-card {
      :deep(.p-card) {
        border-radius: 0.5rem;
        overflow: hidden;
      }

      .card-title {
        padding: 0 0.75rem;
      }

      .menu-wrapper {
        overflow-x: hidden;
      }
    }
  }

  .plugin-list {
    flex: 1;

    .toolbar {
      margin-bottom: 1rem;

      :deep(.sort-select) {
        min-width: 150px;
      }

      :deep(.time-filter-select) {
        min-width: 150px;
      }
    }

    .plugin-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 1rem;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .plugin-card {
      transition: box-shadow 0.3s;

      &:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        display: flex;
        align-items: flex-start;
        padding: 1rem;

        img {
          margin-right: 0.75rem;
        }
      }

      .plugin-info {
        flex: 1;

        h3 {
          font-size: 1.125rem;
          font-weight: 500;
          margin: 0;
        }

        p {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      }

      .plugin-stats {
        text-align: right;

        .downloads {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      }

      .plugin-description {
        color: #4b5563;
        font-size: 0.875rem;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .card-footer {
        margin-top: 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .plugin-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
      }
    }
  }

  .pagination {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
  }
}

/* PrimeVue 组件样式覆盖 */
:deep(.p-menu) {
  border: none;
  padding: 0;
  background: transparent;

  .p-menuitem {
    margin: 0;
  }

  .p-menuitem-link {
    padding: 0.75rem 1rem;
  }
}

:deep(.p-rating .p-rating-item.p-rating-item-active .p-rating-icon) {
  color: #fbbf24;
}
</style>