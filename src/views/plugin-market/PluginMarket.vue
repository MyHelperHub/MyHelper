<template>
  <div class="plugin-market">
    <!-- 顶部搜索和过滤区域 -->
    <div class="search-area">
      <div class="container">
        <div class="search-wrapper">
          <div class="search-input">
            <InputText v-model="state.searchQuery" placeholder="搜索插件..." />
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
                <Listbox
                  v-model="state.selectedCategory"
                  :options="categoryMenuItems"
                  optionLabel="label"
                  optionValue="value"
                  class="category-menu-list"
                  @change="selectCategory" />
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
                v-model="state.currentSort"
                :options="sortOptions"
                optionLabel="label"
                optionValue="value"
                class="sort-select"
                placeholder="排序方式"
                :panelStyle="{ width: '200px' }" />
            </template>
            <template #end>
              <Select
                v-model="state.timeFilter"
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
              v-model:first="state.first"
              :rows="9"
              :total-records="state.total"
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
import Listbox from "primevue/listbox";
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
interface State {
  searchQuery: string;
  selectedCategory: number;
  currentSort: number;
  timeFilter: string;
  first: number;
  total: number;
}

enum SortType {
  Downloads = 0,
  Rating = 1,
  Latest = 2,
}

const state = ref<State>({
  searchQuery: "",
  selectedCategory: 1,
  currentSort: SortType.Downloads,
  timeFilter: "all",
  first: 0,
  total: 100,
});

// 分类菜单项
const categoryMenuItems = ref([
  {
    label: "全部插件",
    icon: "pi pi-list",
    badge: "1234",
    value: 1,
  },
  {
    label: "开发工具",
    icon: "pi pi-code",
    badge: "328",
    value: 2,
  },
  {
    label: "效率工具",
    icon: "pi pi-clock",
    badge: "246",
    value: 3,
  },
  {
    label: "网络工具",
    icon: "pi pi-wifi",
    badge: "185",
    value: 4,
  },
  {
    label: "系统工具",
    icon: "pi pi-desktop",
    badge: "142",
    value: 5,
  },
  {
    label: "娱乐工具",
    icon: "pi pi-play",
    badge: "98",
    value: 6,
  },
]);

// 排序选项
const sortOptions = ref([
  { label: "下载量", value: 0 },
  { label: "好评数", value: 1 },
  { label: "最新", value: 2 },
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
  {
    id: 4,
    name: "系统监控助手",
    author: "SystemPro",
    icon: "https://placeholder.co/48",
    description: "实时监控系统资源占用，包括CPU、内存、硬盘等使用情况。",
    rating: 4.6,
    downloads: 23456,
    tags: ["系统工具", "监控"],
  },
  {
    id: 5,
    name: "音乐播放器",
    author: "MusicLover",
    icon: "https://placeholder.co/48",
    description: "支持多种音频格式，提供均衡器、歌词显示等高级功能。",
    rating: 4.5,
    downloads: 78901,
    tags: ["娱乐工具", "音乐"],
  },
  {
    id: 6,
    name: "Git可视化工具",
    author: "GitMaster",
    icon: "https://placeholder.co/48",
    description: "图形化展示Git操作，简化版本控制流程，适合团队协作。",
    rating: 4.8,
    downloads: 56789,
    tags: ["开发工具", "Git"],
  },
  {
    id: 7,
    name: "文件同步器",
    author: "SyncPro",
    icon: "https://placeholder.co/48",
    description: "自动同步文件到多个设备或云端，支持实时同步和定时备份。",
    rating: 4.7,
    downloads: 34567,
    tags: ["效率工具", "同步"],
  },
  {
    id: 8,
    name: "防火墙管理器",
    author: "SecurityExpert",
    icon: "https://placeholder.co/48",
    description: "可视化管理系统防火墙，提供实时网络安全监控和威胁防护。",
    rating: 4.9,
    downloads: 45678,
    tags: ["网络工具", "安全"],
  },
  {
    id: 9,
    name: "硬件诊断工具",
    author: "HardwarePro",
    icon: "https://placeholder.co/48",
    description: "全面检测电脑硬件状态，提供详细的诊断报告和优化建议。",
    rating: 4.6,
    downloads: 23456,
    tags: ["系统工具", "诊断"],
  },
  {
    id: 10,
    name: "视频编辑器",
    author: "VideoMaster",
    icon: "https://placeholder.co/48",
    description: "简单易用的视频编辑工具，支持剪辑、特效、字幕等能。",
    rating: 4.8,
    downloads: 67890,
    tags: ["娱乐工具", "视频"],
  },
  {
    id: 11,
    name: "数据库管理工具",
    author: "DBMaster",
    icon: "https://placeholder.co/48",
    description: "支持多种数据库的可视化管理，简化数据库操作和维护。",
    rating: 4.7,
    downloads: 45678,
    tags: ["开发工具", "数据库"],
  },
  {
    id: 12,
    name: "任务自动化工具",
    author: "AutoPro",
    icon: "https://placeholder.co/48",
    description: "通过简单的配置实现任务自动化，提高工作效率。",
    rating: 4.8,
    downloads: 34567,
    tags: ["效率工具", "自动化"],
  },
  {
    id: 13,
    name: "网络抓包工具",
    author: "PacketMaster",
    icon: "https://placeholder.co/48",
    description: "专业的网络数据包分析工具，支持多协议解析和流量监控。",
    rating: 4.6,
    downloads: 23456,
    tags: ["网络工具", "抓包"],
  },
]);

// 方法定义
const selectCategory = (event: { value: any }) => {
  const selectedValue = event.value;
  if (selectedValue) {
    state.value.selectedCategory = selectedValue;
    // 这里可以添加获取分类插件的逻辑
  }
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("zh-CN").format(num);
};

// 搜索方法
const handleSearch = () => {
  console.log("执行搜索:", state.value.searchQuery);
  // 现在可以直接将 state 对象发送到后端
  // const params = {
  //   searchQuery: state.value.searchQuery,
  //   currentSort: state.value.currentSort,
  //   timeFilter: state.value.timeFilter,
  //   page: state.value.first / 9 + 1
  // };
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
    height: calc(100vh - 120px);
    overflow: hidden;
  }

  .category-menu {
    width: 12rem;
    flex: none;
    overflow-y: hidden;

    .menu-card {
      :deep(.p-card) {
        border-radius: 0.5rem;
        overflow: hidden;
      }

      .card-title {
        padding: 0 0.75rem;
      }
      :deep(.p-listbox-list-container) {
        overflow: hidden;
        width: 100%;
        max-height: unset !important;
      }
    }
  }

  .plugin-list {
    flex: 1;
    overflow-y: auto;
    padding-right: 1rem;

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
:deep(.p-rating .p-rating-item.p-rating-item-active .p-rating-icon) {
  color: #fbbf24;
}
</style>
