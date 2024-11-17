<template>
  <div class="plugin-market">
    <i class="pi pi-times close close-button" @click="handleClose"></i>
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
          <div class="button-group">
            <Button
              icon="pi pi-list"
              label="已安装插件"
              class="installed-button"
              @click="showInstalledPlugins" />
          </div>
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
              v-for="plugin in filteredPlugins"
              :key="plugin.id"
              class="plugin-card"
              @click="showPluginDetail(plugin)">
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
              :rows="20"
              :total-records="state.total"
              :rows-per-page-options="[20, 40, 60]" />
          </div>
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <Dialog
      v-model:visible="showDetail"
      :modal="true"
      :style="{ width: '50vw' }"
      :header="selectedPlugin?.name"
      class="plugin-detail-dialog"
      dismissableMask>
      <div class="plugin-detail" v-if="selectedPlugin">
        <!-- 插件头部信息 -->
        <div class="plugin-header">
          <Image
            :src="selectedPlugin.icon"
            :alt="selectedPlugin.name"
            width="64"
            height="64" />
          <div class="plugin-info">
            <p class="author">作者：{{ selectedPlugin.author }}</p>
            <div class="stats">
              <div class="rating-wrapper">
                <Rating
                  v-if="isPluginInstalled(selectedPlugin)"
                  v-model="userRating"
                  :cancel="false"
                  @change="handleRating" />
                <Rating
                  v-else
                  :modelValue="selectedPlugin.rating"
                  :cancel="false"
                  readonly />
                <small
                  v-if="isPluginInstalled(selectedPlugin)"
                  class="rating-hint">
                  {{ userRating ? "您的评分" : "点击星星进行评分" }}
                </small>
              </div>
              <span class="downloads"
                >{{ formatNumber(selectedPlugin.downloads) }}次下载</span
              >
            </div>
          </div>
        </div>

        <!-- 插件标签 -->
        <div class="plugin-tags">
          <Tag
            v-for="tag in selectedPlugin.tags"
            :key="tag"
            :value="tag"
            severity="info" />
        </div>

        <!-- 插件详细描述 -->
        <div class="description">
          <h3>插件描述</h3>
          <p>{{ selectedPlugin.description }}</p>
        </div>

        <!-- 插件截图 -->
        <div class="screenshots" v-if="selectedPlugin.screenshots?.length">
          <h3>插件截图</h3>
          <Carousel
            :value="selectedPlugin.screenshots"
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
          <p>当前版本：{{ selectedPlugin.version }}</p>
          <p>更新时间：{{ selectedPlugin.updateTime }}</p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="取消" class="p-button-text" @click="closeDetail" />
          <template v-if="isPluginInstalled(selectedPlugin)">
            <Button
              v-if="selectedPlugin?.hasUpdate"
              label="更新"
              icon="pi pi-sync"
              severity="info"
              @click="updatePlugin(selectedPlugin)" />
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
            @click="handleDownload" />
        </div>
      </template>
    </Dialog>

    <!-- 已安装插件对话框 -->
    <Dialog
      v-model:visible="showInstalled"
      :modal="true"
      header="已安装插件"
      :style="{ width: '80vw' }"
      class="installed-plugins-dialog">
      <div class="installed-plugins-list">
        <DataTable
          :value="installedPlugins"
          :paginator="true"
          :rows="5"
          tableStyle="min-width: 50rem"
          class="installed-table">
          <Column field="name" header="插件名称" :sortable="true">
            <template #body="slotProps">
              <div
                class="plugin-name-cell clickable"
                @click="showPluginDetail(slotProps.data)">
                <Image
                  :src="slotProps.data.icon"
                  :alt="slotProps.data.name"
                  width="32"
                  height="32" />
                <div class="plugin-basic-info">
                  <span class="name">{{ slotProps.data.name }}</span>
                  <span class="description">{{
                    slotProps.data.description
                  }}</span>
                </div>
              </div>
            </template>
          </Column>
          <Column field="version" header="版本" :sortable="true">
            <template #body="slotProps">
              <div class="version-cell">
                <span class="current-version">{{
                  slotProps.data.version
                }}</span>
                <Tag
                  v-if="slotProps.data.hasUpdate"
                  severity="warning"
                  value="有更新"
                  class="update-tag" />
              </div>
            </template>
          </Column>
          <Column field="author" header="作者" :sortable="true">
            <template #body="slotProps">
              <div class="author-cell">
                <span>{{ slotProps.data.author }}</span>
              </div>
            </template>
          </Column>
          <Column field="installDate" header="安装日期" :sortable="true">
            <template #body="slotProps">
              <div class="date-cell">
                <span>{{ formatDate(slotProps.data.installDate) }}</span>
              </div>
            </template>
          </Column>
          <Column field="status" header="状态" :sortable="true">
            <template #body="slotProps">
              <div class="status-cell">
                <Tag
                  :severity="getStatusSeverity(slotProps.data.status)"
                  :value="slotProps.data.status" />
              </div>
            </template>
          </Column>
          <Column header="操作" :style="{ width: '8rem' }">
            <template #body="slotProps">
              <div class="action-cell">
                <Button
                  v-if="slotProps.data.hasUpdate"
                  icon="pi pi-sync"
                  severity="info"
                  text
                  v-tooltip.top="'更新插件'"
                  @click="updatePlugin(slotProps.data)"
                  class="action-button" />
                <Button
                  v-if="slotProps.data.status === '已启用'"
                  icon="pi pi-power-off"
                  severity="warning"
                  text
                  v-tooltip.top="'禁用插件'"
                  @click="togglePlugin(slotProps.data, false)"
                  class="action-button" />
                <Button
                  v-else
                  icon="pi pi-power-off"
                  severity="success"
                  text
                  v-tooltip.top="'启用插件'"
                  @click="togglePlugin(slotProps.data, true)"
                  class="action-button" />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  v-tooltip.top="'卸载插件'"
                  @click="uninstallPlugin(slotProps.data)"
                  class="action-button" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>

    <!-- 添加开发者按钮 -->
    <div class="developer-button">
      <Button
        icon="pi pi-code"
        label="我是开发者"
        text
        @click="gotoDevelop"
        class="developer-link" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
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
import { ipcCloseWindow } from "@/api/ipc/window.api";
import { NewWindowEnum } from "@/interface/windowEnum";
import Dialog from "primevue/dialog";
import Carousel from "primevue/carousel";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useRouter } from "vue-router";
import { showLoading, hideLoading } from "@/utils/loading";

/** 插件对象接口 */
interface Plugin {
  id: number;
  name: string;
  author: string;
  icon: string;
  description: string;
  rating: number;
  downloads: number;
  tags: string[];
  version: string;
  updateTime: string;
  screenshots?: string[];
  hasUpdate?: boolean;
  status?: string;
  installDate?: string;
}

/** 状态管理接口 */
interface State {
  searchQuery: string;
  selectedCategory: number;
  currentSort: number;
  timeFilter: string;
  first: number;
  total: number;
}

/** 排序类型枚举 */
enum SortType {
  Downloads = 0,
  Rating = 1,
  Latest = 2,
}

const state = reactive<State>({
  searchQuery: "",
  selectedCategory: 1,
  currentSort: SortType.Downloads,
  timeFilter: "all",
  first: 0,
  total: 100,
});

/** 分类菜单项配置 */
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

/** 排序选项配置 */
const sortOptions = ref([
  { label: "下载量", value: 0 },
  { label: "好评数", value: 1 },
  { label: "最新", value: 2 },
]);

/** 时间筛选选项配置 */
const timeFilterOptions = ref([
  { label: "所有时间", value: "all" },
  { label: "最近一周", value: "week" },
  { label: "最近一月", value: "month" },
  { label: "最近一年", value: "year" },
]);

/** 模拟插件数据 */
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
    version: "1.0.0",
    updateTime: "2024-03-20",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/600x1450.png",
      "https://placeholder.co/800x450.png",
    ],
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
    version: "1.1.0",
    updateTime: "2024-03-15",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
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
    version: "1.0.0",
    updateTime: "2024-03-10",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
  {
    id: 4,
    name: "系统监控助手",
    author: "SystemPro",
    icon: "https://placeholder.co/48",
    description: "实时监控统资源占用，包括CPU、内存、硬盘等使用情况。",
    rating: 4.6,
    downloads: 23456,
    tags: ["系统工具", "监控"],
    version: "1.0.0",
    updateTime: "2024-03-05",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
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
    version: "1.0.0",
    updateTime: "2024-02-28",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
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
    version: "1.0.0",
    updateTime: "2024-02-20",
    screenshots: [
      "https://placeholder.co/800x450",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
  {
    id: 7,
    name: "文件同步器",
    author: "SyncPro",
    icon: "https://placeholder.co/48",
    description: "自动同文件到多个设备或云端，支持实时同步和定时备份。",
    rating: 4.7,
    downloads: 34567,
    tags: ["效率工具", "同步"],
    version: "1.0.0",
    updateTime: "2024-02-15",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
  {
    id: 8,
    name: "防火墙管理器",
    author: "SecurityExpert",
    icon: "https://placeholder.co/48",
    description: "可视化管理系统火墙，提供实时网络安全监控和威胁防护。",
    rating: 4.9,
    downloads: 45678,
    tags: ["网络工具", "安全"],
    version: "1.0.0",
    updateTime: "2024-02-10",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
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
    version: "1.0.0",
    updateTime: "2024-02-05",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
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
    version: "1.0.0",
    updateTime: "2024-01-30",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
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
    version: "1.0.0",
    updateTime: "2024-01-25",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
  {
    id: 12,
    name: "任务自动化工具",
    author: "AutoPro",
    icon: "https://placeholder.co/48",
    description: "通过简单的配置��现任务自动化，提高工作效率。",
    rating: 4.8,
    downloads: 34567,
    tags: ["效率工具", "自动化"],
    version: "1.0.0",
    updateTime: "2024-01-20",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
  {
    id: 13,
    name: "网络抓包工具",
    author: "PacketMaster",
    icon: "https://placeholder.co/48",
    description: "专业的网络数据包分析工，支持多协议解析流量监控。",
    rating: 4.6,
    downloads: 23456,
    tags: ["网络工具", "抓包"],
    version: "1.0.0",
    updateTime: "2024-01-15",
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
]);

/** 关闭插件市场窗口 */
const handleClose = () => {
  ipcCloseWindow(NewWindowEnum.PluginMarket);
};

/**
 * 选择插件分类
 * @param event - 分类选择事件对象
 */
const selectCategory = (event: { value: number }) => {
  if (event.value) {
    state.selectedCategory = event.value;
  }
};

/**
 * 格式化数字为本地字符串
 * @param num - 需要格式化的数字
 * @returns 格式化后的字符串
 */
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("zh-CN").format(num);
};

/** 执行插件搜索 */
const handleSearch = () => {
  console.log("执行搜索:", state.searchQuery);
  // TODO: 实现搜索逻辑
};

const showDetail = ref(false);
const selectedPlugin = ref<Plugin | null>(null);

/**
 * 显示插件详情
 * @param plugin - 要显示的插件对象
 */
const showPluginDetail = async (plugin: Plugin) => {
  if (isPluginInstalled(plugin)) {
    const installedPlugin = installedPlugins.value.find(
      (p) => p.id === plugin.id,
    );
    selectedPlugin.value = {
      ...plugin,
      hasUpdate: installedPlugin?.hasUpdate || false,
      status: installedPlugin?.status || "已启用",
    };
    userRating.value = plugin.rating;
  } else {
    selectedPlugin.value = plugin;
    userRating.value = 0;
  }
  showDetail.value = true;
};

/** 关闭插件详情对话框 */
const closeDetail = () => {
  showDetail.value = false;
  userRating.value = 0;
};

/** 处理插件下载 */
const handleDownload = async () => {
  if (!selectedPlugin.value) return;

  try {
    console.log("开始下载插件:", selectedPlugin.value.name);
    // TODO: 实现下载逻辑
    closeDetail();
  } catch (error) {
    console.error("下载插件失败:", error);
    // TODO: 添加错误提示
  }
};

const showInstalled = ref(false);
/** 已安装插件列表 */
const installedPlugins = ref([
  {
    id: 1,
    name: "代码格式化工具",
    description: "一个强大的代码格式化工具，支持多种编程语言",
    version: "1.0.0",
    author: "JohnDoe",
    icon: "https://placeholder.co/32",
    installDate: "2024-03-20",
    status: "已启用",
    hasUpdate: true,
    rating: 4.8,
    downloads: 12580,
    tags: ["开发工具", "VSCode"],
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
  {
    id: 2,
    name: "截图工具Pro",
    description: "专业的屏幕截图工具，支持区域截图、滚动截图",
    version: "1.1.0",
    author: "Jane Smith",
    icon: "https://placeholder.co/32",
    installDate: "2024-03-15",
    status: "已禁用",
    hasUpdate: false,
    rating: 4.9,
    downloads: 45678,
    tags: ["效率工具", "截图"],
    screenshots: [
      "https://placeholder.co/800x450.png",
      "https://placeholder.co/800x450.png",
    ],
  },
]);

/** 显示安装插件列表 */
const showInstalledPlugins = () => {
  showInstalled.value = true;
};

/**
 * 卸载插件
 * @param plugin - 要卸载的插件对象
 */
const uninstallPlugin = (plugin: Plugin) => {
  console.log("卸载插件:", plugin.name);
  // TODO: 实现卸载逻辑
};

/**
 * 格式化日期
 * @param date - 日期字符串
 * @returns 格式化后的日期字符串
 */
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("zh-CN");
};

/**
 * 获取状态标签的样式
 * @param status - 插件状态
 * @returns 对应的样式类型
 */
const getStatusSeverity = (status: string) => {
  switch (status) {
    case "已启用":
      return "success";
    case "已禁用":
      return "danger";
    default:
      return "info";
  }
};

/**
 * 更新插件
 * @param plugin - 要更新的插件对象
 */
const updatePlugin = async (plugin: Plugin | null) => {
  if (!plugin) return;

  try {
    console.log("更新插件:", plugin.name);
    // TODO: 实现更新逻辑
    closeDetail();
  } catch (error) {
    console.error("更新插件失败:", error);
    // TODO: 添加错误提示
  }
};

/**
 * 切换插件启用状态
 * @param plugin - 要切换状态的插件对象
 * @param enable - 是否启用
 */
const togglePlugin = (plugin: Plugin, enable: boolean) => {
  console.log(enable ? "启用插件:" : "禁用插件:", plugin.name);
  plugin.status = enable ? "已启用" : "已禁用";
};

/**
 * 检查插件是否已安装
 * @param plugin - 要检查的插件对象
 * @returns 是否已安装
 */
const isPluginInstalled = (plugin: Plugin | null) => {
  if (!plugin) return false;
  return installedPlugins.value.some((p) => p.id === plugin.id);
};

/** 使用计算属性优化过滤逻辑 */
const filteredPlugins = computed(() => {
  return plugins.value.filter((plugin) => {
    if (state.searchQuery) {
      return (
        plugin.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        plugin.description
          .toLowerCase()
          .includes(state.searchQuery.toLowerCase())
      );
    }
    return true;
  });
});

// 添加评分相关的状态
const userRating = ref(0);

/**
 * 处理用户评分
 * @param event - 用户评分事件对象
 */
const handleRating = async (event: { value: number }) => {
  if (!selectedPlugin.value) return;

  try {
    console.log("提交评分:", {
      pluginId: selectedPlugin.value.id,
      rating: event.value,
    });

    // TODO: 调用评分 API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 更新本地评分显示
    userRating.value = event.value;

    console.log("评分成功");
  } catch (error) {
    console.error("评分失败:", error);
    userRating.value = 0;
  }
};

const router = useRouter();

const gotoDevelop = () => {
  router.push("/develop");
};

// 添加初始化数据的方法
const initializeData = async () => {
  try {
    showLoading(); // 显示加载状态

    // TODO: 这里添加实际的数据加载逻辑
  } catch (error) {
    console.error("初始化数据失败:", error);
  } finally {
    hideLoading(); // 隐藏加载状态
  }
};

// 在组件挂载时初始化数据
onMounted(() => {
  initializeData();
});
</script>

<style lang="less" scoped>
.plugin-market {
  min-height: 100vh;
  background-color: #f8f9fa;

  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    z-index: 1;
  }

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
    overflow-x: hidden;
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
      cursor: pointer;
      transition:
        transform 0.2s,
        box-shadow 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        cursor: pointer;
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
          cursor: pointer;
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

  .developer-button {
    position: fixed;
    left: 20px;
    bottom: 20px;
    z-index: 100;

    .developer-link {
      &:hover {
        color: var(--primary-color);
        background-color: var(--surface-100);
      }
    }
  }
}

/* PrimeVue 组件样式覆盖 */
:deep(.p-rating .p-rating-item.p-rating-item-active .p-rating-icon) {
  color: #fbbf24;
}

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
          color: #666;
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
              color: #666;
              font-size: 0.75rem;
            }

            :deep(.p-rating) {
              .p-rating-item {
                cursor: pointer;

                &:hover {
                  transform: scale(1.1);
                }

                &.p-rating-item-active .p-rating-icon {
                  color: #fbbf24;
                }
              }
            }
          }

          .downloads {
            color: #666;
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
        color: #333;
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
          height: 300px; // 调整为更合适的高度
        }

        :deep(.p-carousel-indicators) {
          margin-top: 1rem;
        }
      }

      .screenshot-container {
        height: 300px; // 与carousel内容区域相同的高度
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
          cursor: pointer; // 添加指针样式提示可点击
          transition: transform 0.2s; // 添加悬停效果

          &:hover {
            transform: scale(1.02); // 悬停时轻放大
          }
        }
      }
    }

    .version-info {
      margin-bottom: 20px;

      h3 {
        margin-bottom: 10px;
      }

      p {
        color: #666;
        margin: 5px 0;
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

// 优化览模式的样式
:deep(.p-image-preview-container) {
  .p-image-preview {
    max-width: 90vw;
    max-height: 90vh;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
  }

  .p-image-preview-indicator {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    padding: 0.5rem;

    &:hover {
      background-color: rgba(0, 0, 0, 0.7);
    }
  }

  .p-image-preview-toolbar {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 0.5rem;
    border-radius: 4px;
  }
}

// 添加遮罩层样式
:deep(.p-image-mask) {
  background-color: rgba(0, 0, 0, 0.9); // 更深的背景色
}

.search-wrapper {
  .button-group {
    display: flex;
    gap: 0.5rem;

    // 添加按钮样式
    :deep(.p-button) {
      padding: 0.4rem 0.8rem; // 减小内边距
      font-size: 0.875rem; // 减小字体大小

      .p-button-icon {
        font-size: 0.875rem; // 减小图标大小
      }
    }

    .installed-button {
      margin-right: 0.5rem;
    }
  }
}

.installed-plugins-dialog {
  :deep(.p-dialog) {
    width: 80vw !important;
    max-width: 1200px;
  }

  .plugin-name-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    img {
      border-radius: 4px;
    }
  }
}

.installed-plugins-dialog {
  .installed-table {
    .plugin-name-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      cursor: pointer;

      &:hover {
        .name {
          color: var(--primary-color);
        }
      }

      img {
        border-radius: 4px;
      }

      .plugin-basic-info {
        display: flex;
        flex-direction: column;

        .name {
          font-weight: 500;
          transition: color 0.2s;
        }

        .description {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.25rem;
        }
      }
    }

    .version-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .update-tag {
        font-size: 0.75rem;
      }
    }

    .status-cell {
      :deep(.p-tag) {
        min-width: 4rem;
        justify-content: center;
      }
    }

    .action-cell {
      display: flex;
      gap: 0.25rem;
      justify-content: flex-start;

      .action-button {
        padding: 0.5rem;

        &:hover {
          background-color: var(--surface-100);
        }
      }
    }
  }
}
</style>

<style lang="less">
@import "../../assets/css/variable.less";
</style>
