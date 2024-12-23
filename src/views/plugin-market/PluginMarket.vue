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
              @click="showInstalled = true" />
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
                :panelStyle="{ width: '200px' }"
                @change="handleSortChange" />
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
              :key="plugin.Id"
              class="plugin-card"
              @click="showPluginDetail(plugin)">
              <template #header>
                <div class="card-header">
                  <Image
                    class="plugin-icon"
                    :src="plugin.Icon"
                    width="64"
                    height="64" />
                  <div class="plugin-info">
                    <h3
                      v-tooltip.bottom="{
                        value: plugin.Name,
                        showDelay: 500,
                        pt: {
                          text: {
                            style: {
                              fontSize: '15px',
                            },
                          },
                        },
                      }">
                      {{ plugin.Name }}
                    </h3>
                    <p>{{ plugin.Author }}</p>
                  </div>
                  <div class="plugin-stats">
                    <Rating
                      v-model="plugin.Rating"
                      :cancel="false"
                      readonly
                      v-tooltip.bottom="{
                        value: `${plugin.Rating}分`,
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
                      {{ formatNumber(plugin.Downloads) }}次下载
                    </div>
                  </div>
                </div>
              </template>
              <template #content>
                <div class="plugin-description">
                  {{ plugin.Description }}
                </div>
                <div class="card-footer">
                  <div class="plugin-tags">
                    <Tag
                      v-for="tag in plugin.Tags"
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
      :header="selectedPlugin?.Name"
      class="plugin-detail-dialog"
      dismissableMask>
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
            <div class="stats">
              <div class="rating-wrapper">
                <Rating
                  v-if="isPluginInstalled(selectedPlugin)"
                  v-model="userRating"
                  :cancel="false"
                  @change="handleRating" />
                <Rating
                  v-else
                  :modelValue="selectedPlugin.Rating"
                  :cancel="false"
                  readonly />
                <small
                  v-if="isPluginInstalled(selectedPlugin)"
                  class="rating-hint">
                  {{ userRating ? "您的评分" : "点击星星进行评分" }}
                </small>
              </div>
              <span class="downloads"
                >{{ formatNumber(selectedPlugin.Downloads) }}次下载</span
              >
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
          <p>当前版本：{{ selectedPlugin.Version }}</p>
          <p>
            更新时间：{{
              new Date(selectedPlugin.UpdateTime).toLocaleDateString("zh-CN")
            }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <Button label="取消" class="p-button-text" @click="closeDetail" />
          <template v-if="isPluginInstalled(selectedPlugin)">
            <Button
              v-if="selectedPlugin?.HasUpdate"
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
          <Column field="Name" header="插件名称" :sortable="true">
            <template #body="slotProps">
              <div
                class="plugin-name-cell clickable"
                @click="showPluginDetail(slotProps.data)">
                <Image
                  :src="slotProps.data.Icon"
                  :alt="slotProps.data.Name"
                  width="32"
                  height="32" />
                <div class="plugin-basic-info">
                  <span class="name">{{ slotProps.data.Name }}</span>
                  <span class="description">{{
                    slotProps.data.Description
                  }}</span>
                </div>
              </div>
            </template>
          </Column>
          <Column field="Version" header="版本" :sortable="true">
            <template #body="slotProps">
              <div class="version-cell">
                <span class="current-version">{{
                  slotProps.data.Version
                }}</span>
                <Tag
                  v-if="slotProps.data.HasUpdate"
                  severity="warning"
                  value="有更新"
                  class="update-tag" />
              </div>
            </template>
          </Column>
          <Column field="Author" header="作者" :sortable="true">
            <template #body="slotProps">
              <div class="author-cell">
                <span>{{ slotProps.data.Author }}</span>
              </div>
            </template>
          </Column>
          <Column field="CreateTime" header="安装日期" :sortable="true">
            <template #body="slotProps">
              <div class="date-cell">
                <span>{{ formatDate(slotProps.data.CreateTime) }}</span>
              </div>
            </template>
          </Column>
          <Column field="Status" header="状态" :sortable="true">
            <template #body="slotProps">
              <div class="status-cell">
                <Tag
                  :severity="getStatusSeverity(slotProps.data.Status)"
                  :value="getStatusLabel(slotProps.data.Status)" />
              </div>
            </template>
          </Column>
          <Column header="操作" :style="{ width: '8rem' }">
            <template #body="slotProps">
              <div class="action-cell">
                <Button
                  v-if="slotProps.data.HasUpdate"
                  icon="pi pi-sync"
                  severity="info"
                  text
                  v-tooltip.top="'更新插件'"
                  @click="updatePlugin(slotProps.data)"
                  class="action-button" />
                <Button
                  v-if="slotProps.data.Status === 'ENABLED'"
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
import Dialog from "primevue/dialog";
import Carousel from "primevue/carousel";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useRouter } from "vue-router";
import { showLoading, hideLoading } from "@/utils/loading";
import { useToast } from "primevue/usetoast";
import {
  getPluginList,
  downloadPlugin,
  ratePlugin,
  updatePluginStatus,
} from "@/api/network/plugin.api";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { NewWindowEnum } from "@/interface/windowEnum";
import { WindowOperation } from "@/interface/enum";
import {
  PluginCategory,
  PluginStatus,
  PluginSortType,
} from "@/interface/plugin.d";

const toast = useToast();
const router = useRouter();

/** 插件对象接口 */
interface Plugin {
  Position: [number, number] | null;
  Name: string;
  Message: string | null;
  Id: number;
  Size: [number, number];
  Version: string;
  Description: string;
  Tags: string[];
  Icon: string | null;
  Rating: number;
  Author: string;
  Status: PluginStatus;
  Title: string;
  AlwaysOnTop: boolean;
  Resizable: boolean;
  WindowId: string;
  HasUpdate: boolean;
  Email: string;
  Downloads: number;
  Category: PluginCategory;
  CreateTime: string;
  UpdateTime: string;
  Screenshots: string[];
}

/** 状态管理 */
const state = reactive({
  searchQuery: "",
  selectedCategory: "ALL",
  currentSort: PluginSortType.DOWNLOADS_DESC,
  timeFilter: "",
  first: 0,
  total: 0,
});

// 分类选项
const categoryMenuItems = [
  { label: "全部", value: "ALL" },
  { label: "开发工具", value: PluginCategory.DEVELOPMENT },
  { label: "效率工具", value: PluginCategory.EFFICIENCY },
  { label: "网络工具", value: PluginCategory.NETWORK },
  { label: "系统工具", value: PluginCategory.SYSTEM },
  { label: "娱乐工具", value: PluginCategory.ENTERTAINMENT },
  { label: "其他", value: PluginCategory.OTHER },
];

// 排序选项
const sortOptions = [
  { label: "下载量（从高到低）", value: PluginSortType.DOWNLOADS_DESC },
  { label: "下载量（从低到高）", value: PluginSortType.DOWNLOADS_ASC },
  { label: "评分（从高到低）", value: PluginSortType.RATING_DESC },
  { label: "评分（从低到高）", value: PluginSortType.RATING_ASC },
  { label: "更新时间（最新）", value: PluginSortType.UPDATE_TIME_DESC },
  { label: "更新时间（最早）", value: PluginSortType.UPDATE_TIME_ASC },
];

/** 时间筛选选项 */
const timeFilterOptions = ref([
  { label: "所有时间", value: "all" },
  { label: "最近一周", value: "week" },
  { label: "最近一月", value: "month" },
  { label: "最近一年", value: "year" },
]);

const plugins = ref<Plugin[]>([]);
const installedPlugins = ref<Plugin[]>([]);
const showDetail = ref(false);
const selectedPlugin = ref<Plugin | null>(null);
const userRating = ref(0);
const showInstalled = ref(false);

/** 初始化数据 */
const initializeData = async () => {
  try {
    showLoading();
    const params: any = {
      sort: state.currentSort,
      pageIndex: Math.floor(state.first / 20) + 1,
      pageSize: 20,
    };
    if (state.selectedCategory !== "ALL") {
      params.category = state.selectedCategory;
    }
    const response = await getPluginList(params);
    plugins.value = response.Data as unknown as Plugin[];
    if (response.Page) {
      state.total = response.Page.TotalRecords;
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "加载插件列表失败",
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 格式化数字 */
const formatNumber = (num: number | undefined) => {
  if (!num) return "0";
  return new Intl.NumberFormat("zh-CN").format(num);
};

/** 搜索插件 */
const handleSearch = () => {
  console.log("执行搜索:", state.searchQuery);
  initializeData();
};

/** 显示插件详情 */
const showPluginDetail = async (plugin: Plugin) => {
  if (isPluginInstalled(plugin)) {
    const installedPlugin = installedPlugins.value.find(
      (p) => p.WindowId === plugin.WindowId,
    );
    selectedPlugin.value = {
      ...plugin,
      HasUpdate: installedPlugin?.HasUpdate || false,
      Status: installedPlugin?.Status || PluginStatus.PUBLISHED,
    };
    userRating.value = plugin.Rating;
  } else {
    selectedPlugin.value = plugin;
    userRating.value = 0;
  }
  showDetail.value = true;
};

/** 关闭详情 */
const closeDetail = () => {
  showDetail.value = false;
  userRating.value = 0;
};

/** 下载插件 */
const handleDownload = async () => {
  if (!selectedPlugin.value?.WindowId) return;

  try {
    showLoading();
    await downloadPlugin(selectedPlugin.value.WindowId);
    toast.add({
      severity: "success",
      summary: "成功",
      detail: "插件下载成功",
      life: 3000,
    });
    closeDetail();
    await initializeData(); // 重新加载数据
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "插件下载失败",
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 评分 */
const handleRating = async (event: { value: number }) => {
  if (!selectedPlugin.value?.WindowId) return;

  try {
    showLoading();
    await ratePlugin(selectedPlugin.value.WindowId, event.value);
    // 更新本地插件的评分
    if (selectedPlugin.value) {
      selectedPlugin.value.Rating = event.value;
    }
    toast.add({
      severity: "success",
      summary: "成功",
      detail: "评分成功",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "评分失败",
      life: 3000,
    });
    userRating.value = 0;
  } finally {
    hideLoading();
  }
};

/** 更新插件 */
const updatePlugin = async (plugin: Plugin) => {
  if (!plugin?.WindowId) return;

  try {
    showLoading();
    await updatePluginStatus(
      plugin.WindowId,
      PluginStatus.PUBLISHED.toString(),
    );
    toast.add({
      severity: "success",
      summary: "成功",
      detail: "插件更新成功",
      life: 3000,
    });
    await initializeData(); // 重新加载数据
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "插件更新失败",
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 切换插件状态 */
const togglePlugin = async (plugin: Plugin, enable: boolean) => {
  if (!plugin.WindowId) return;

  try {
    showLoading();
    await updatePluginStatus(
      plugin.WindowId,
      enable
        ? PluginStatus.PUBLISHED.toString()
        : PluginStatus.DISABLED.toString(),
    );
    toast.add({
      severity: "success",
      summary: "成功",
      detail: `插件${enable ? "启用" : "禁用"}成功`,
      life: 3000,
    });
    initializeData();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: `插件${enable ? "启用" : "禁用"}失败`,
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 获取状态样式 */
const getStatusSeverity = (status: PluginStatus) => {
  switch (status) {
    case PluginStatus.PUBLISHED:
      return "success";
    case PluginStatus.DISABLED:
      return "danger";
    case PluginStatus.REVIEWING:
      return "warning";
    case PluginStatus.REJECTED:
      return "danger";
    default:
      return "info";
  }
};

/** 获取状态文本 */
const getStatusLabel = (status: PluginStatus) => {
  switch (status) {
    case PluginStatus.PUBLISHED:
      return "已发布";
    case PluginStatus.DISABLED:
      return "已禁用";
    case PluginStatus.REVIEWING:
      return "审核中";
    case PluginStatus.REJECTED:
      return "已驳回";
    default:
      return status;
  }
};

/** 跳转开发者页面 */
const gotoDevelop = () => {
  router.push("/develop");
};

/** 关闭窗口 */
const handleClose = () => {
  ipcWindowControl(WindowOperation.Close, {
    window_id: NewWindowEnum.PluginMarket,
  });
};

const filteredPlugins = computed(() => {
  return plugins.value.filter((plugin) => {
    if (state.searchQuery) {
      return (
        plugin.Name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        plugin.Description?.toLowerCase().includes(
          state.searchQuery.toLowerCase(),
        )
      );
    }
    return true;
  });
});

const isPluginInstalled = (plugin: Plugin | null) => {
  if (!plugin) return false;
  return installedPlugins.value.some((p) => p.WindowId === plugin.WindowId);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("zh-CN");
};

/** 卸载插件 */
const uninstallPlugin = async (plugin: Plugin) => {
  if (!plugin?.WindowId) return;

  // try {
  //   showLoading();
  //   toast.add({
  //     severity: 'success',
  //     summary: '成功',
  //     detail: '插件卸载成功',
  //     life: 3000
  //   });
  //   await initializeData();
  // } catch (error) {
  //   toast.add({
  //     severity: 'error',
  //     summary: '错误',
  //     detail: '插件卸载失败',
  //     life: 3000
  //   });
  // } finally {
  //   hideLoading();
  // }
};

const selectCategory = (event: { value: string }) => {
  state.selectedCategory = event.value;
  initializeData();
};

/** 处理排序变化 */
const handleSortChange = (event: { value: PluginSortType }) => {
  state.currentSort = event.value;
  initializeData();
};

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
    z-index: 5001;
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
        height: 60px; // 固定描述区域高度
        color: #4b5563;
        font-size: 0.875rem;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3; // 显示3行,超出显示省略号
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
        padding-top: 0 !important;
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
        height: 300px; // 与carousel内容区相同的高度
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
