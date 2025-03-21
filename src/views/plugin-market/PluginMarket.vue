<template>
  <div class="plugin-market">
    <ConfirmPopup />
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <!-- 顶部搜索和过滤区域 -->
    <div class="search-area" data-tauri-drag-region>
      <div class="container">
        <div class="search-wrapper" data-tauri-drag-region>
          <div class="search-input">
            <InputText
              v-model="state.keyword"
              placeholder="搜索插件..."
              @keydown.enter="handleSearch" />
            <i
              v-if="state.keyword"
              class="pi pi-times-circle clear-button"
              @click="clearSearch" />
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
              @click="handleShowInstalled" />
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
                  v-model="state.category"
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
                v-model="state.sort"
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
                :panelStyle="{ width: '200px' }"
                @change="handleTimeFilterChange" />
            </template>
          </Toolbar>

          <!-- 插件网格 -->
          <div class="plugin-grid">
            <Card
              v-for="pluginDetail in plugins"
              :key="pluginDetail.Plugin.Id"
              class="plugin-card"
              @click="showPluginDetail(pluginDetail)">
              <template #header>
                <div class="card-header">
                  <Image
                    class="plugin-icon"
                    :src="pluginDetail.Plugin.Icon"
                    width="64"
                    height="64" />
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
                      v-model="pluginDetail.Plugin.Rating"
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
                      v-for="tag in pluginDetail.Plugin.Tags"
                      :key="tag"
                      :value="tag"
                      severity="info" />
                  </div>
                  <template
                    v-if="
                      installedPluginIds.includes(pluginDetail.Plugin.WindowId)
                    ">
                    <Button
                      v-if="
                        checkPluginUpdate(
                          installedPlugins.find(
                            (p) => p.WindowId === pluginDetail.Plugin.WindowId,
                          )?.Version || '',
                          pluginDetail.Plugin.Version,
                        )
                      "
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
                  <Button
                    v-else
                    icon="pi pi-download"
                    label="下载"
                    size="small" />
                </div>
              </template>
            </Card>
          </div>

          <!-- 分页 -->
          <div class="pagination">
            <Paginator
              :first="(state.pageIndex - 1) * state.pageSize"
              :rows="state.pageSize"
              :total-records="state.total"
              :rows-per-page-options="[20, 40, 60]"
              @page="onPageChange" />
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
            <div class="stats" v-if="!isPluginInstalled(selectedPlugin)">
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
                  v-model="userRating"
                  :cancel="false"
                  :readonly="selectedPluginIsRated"
                  @change="handleRating"
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
                    installedPluginIds.includes(selectedPlugin?.WindowId || '')
                  ">
                  点击星星进行评分
                </span>
                <span class="rating-hint" v-else-if="selectedPluginIsRated">
                  您已评分
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
                  <template v-if="isPluginInstalled(selectedPlugin)">
                    {{
                      installedPlugins.find(
                        (p) => p.WindowId === selectedPlugin?.WindowId,
                      )?.Version
                    }}
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
                isPluginInstalled(selectedPlugin) &&
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
          <Button label="取消" class="p-button-text" @click="closeDetail" />
          <template v-if="isPluginInstalled(selectedPlugin)">
            <Button
              v-if="hasUpdate"
              label="更新"
              icon="pi pi-sync"
              severity="info"
              @click="handleDownload(selectedPlugin, true)" />
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
            @click="handleDownload(selectedPlugin, false)" />
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
                  v-if="
                    checkPluginUpdate(
                      slotProps.data.Version,
                      plugins.find(
                        (p) => p.Plugin.WindowId === slotProps.data.WindowId,
                      )?.Plugin.Version || '',
                    )
                  "
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
                <span>{{ formatDate(slotProps.data.installTime) }}</span>
              </div>
            </template>
          </Column>
          <Column field="Status" header="状态" :sortable="true">
            <template #body="slotProps">
              <div class="status-cell">
                <Tag
                  :severity="
                    slotProps.data.config?.isEnabled ? 'success' : 'danger'
                  "
                  :value="
                    slotProps.data.config?.isEnabled ? '已启用' : '已禁用'
                  " />
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
                  @click="handleDownload(slotProps.data, true)"
                  class="action-button" />
                <Button
                  :icon="
                    slotProps.data.config?.isEnabled
                      ? 'pi pi-check-circle'
                      : 'pi pi-times-circle'
                  "
                  :severity="
                    slotProps.data.config?.isEnabled ? 'success' : 'danger'
                  "
                  text
                  v-tooltip.top="
                    slotProps.data.config?.isEnabled
                      ? '点击禁用插件'
                      : '点击启用插件'
                  "
                  @click="
                    togglePlugin(
                      slotProps.data,
                      !slotProps.data.config?.isEnabled,
                    )
                  "
                  class="action-button" />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  v-tooltip.top="'卸载插件'"
                  @click="(e) => uninstallPlugin(slotProps.data, e)"
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
import { ref, reactive, onMounted, computed } from "vue";
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
import { useConfirm } from "primevue/useconfirm";
import {
  installPlugin,
  getPluginConfig,
  setPluginConfig,
} from "@/utils/plugin";
import {
  getPluginList,
  downloadPlugin,
  ratePlugin,
} from "@/api/network/plugin.api";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { ipcUninstallPlugin } from "@/api/ipc/plugin.api";
import { NewWindowEnum } from "@/interface/windowEnum";
import { WindowOperation } from "@/interface/enum";
import { ResponseCodeEnum } from "@/interface/enum";
import {
  Plugin,
  PluginCategory,
  PluginStatus,
  PluginSortType,
  PluginDetail,
} from "@/interface/plugin.d";
import { appDataDir } from "@tauri-apps/api/path";
import { format } from "date-fns";
import ConfirmPopup from "primevue/confirmpopup";
import GlobalData from "@/utils/globalData";

const toast = useToast();
const router = useRouter();
const confirm = useConfirm();

const plugins = ref<PluginDetail[]>([]);
const installedPlugins = ref<Plugin[]>([]);
const installedPluginIds = ref<string[]>([]);
const showDetail = ref(false);
const selectedPlugin = ref<Plugin | null>(null);
const selectedPluginIsRated = ref(false);
const userRating = ref(0);
const showInstalled = ref(false);
const userData = ref<{ Token?: string } | null>(null);

/** 状态管理 */
const state = reactive({
  keyword: "",
  category: "ALL",
  sort: PluginSortType.SMART,
  timeFilter: "all",
  pageIndex: 1,
  pageSize: 20,
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
  { label: "智能排序", value: PluginSortType.SMART },
  { label: "下载量（从高到低）", value: PluginSortType.DOWNLOADS_DESC },
  { label: "下载量（从低到高）", value: PluginSortType.DOWNLOADS_ASC },
  { label: "评分（从高到低）", value: PluginSortType.RATING_DESC },
  { label: "评分（从低到高）", value: PluginSortType.RATING_ASC },
  { label: "更新时间（最新）", value: PluginSortType.UPDATE_TIME_DESC },
  { label: "更新时间（最早）", value: PluginSortType.UPDATE_TIME_ASC },
];

/** 时间筛选选项 */
const timeFilterOptions = [
  { label: "所有时间", value: "all" },
  { label: "最近一周", value: "week" },
  { label: "最近一月", value: "month" },
  { label: "最近一年", value: "year" },
];

/** 初始化数据 */
const initializeData = async () => {
  try {
    showLoading();
    // 获取已安装插件列表
    await getInstalledPlugins();

    const params: any = {
      sort: state.sort,
      pageIndex: state.pageIndex,
      pageSize: state.pageSize,
      timeFilter: state.timeFilter,
      keyword: state.keyword,
    };
    if (state.category !== "ALL") {
      params.category = state.category;
    }
    const response = await getPluginList(params);
    if (response.Code === ResponseCodeEnum.SUCCESS && response.Data) {
      plugins.value = response.Data as unknown as PluginDetail[];
      if (response.Page) {
        state.total = response.Page.TotalRecords;
      }
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
  state.pageIndex = 1; // 重置分页到第一页
  initializeData();
};

/** 处理分页变化 */
const onPageChange = (event: { page: number; rows: number }) => {
  state.pageIndex = event.page + 1;
  state.pageSize = event.rows;
  initializeData();
};

/** 选择分类 */
const selectCategory = (event: { value: string }) => {
  state.category = event.value;
  state.pageIndex = 1; // 重置分页到第一页
  initializeData();
};

/** 处理排序变化 */
const handleSortChange = (event: { value: PluginSortType }) => {
  state.sort = event.value;
  state.pageIndex = 1; // 重置分页到第一页
  initializeData();
};

/** 检查插件是否有更新 */
const checkPluginUpdate = (localVersion?: string, remoteVersion?: string) => {
  // 如果任一版本号为空，则返回 false
  if (!localVersion || !remoteVersion) {
    return false;
  }

  try {
    const localParts = localVersion.split(".");
    const remoteParts = remoteVersion.split(".");

    // 比较主版本号
    const localMajor = parseInt(localParts[0]);
    const remoteMajor = parseInt(remoteParts[0]);
    if (remoteMajor > localMajor) return true;
    if (remoteMajor < localMajor) return false;

    // 比较次版本号
    if (localParts.length > 1 && remoteParts.length > 1) {
      const localMinor = parseInt(localParts[1]);
      const remoteMinor = parseInt(remoteParts[1]);
      if (remoteMinor > localMinor) return true;
      if (remoteMinor < localMinor) return false;
    }

    // 比较修订号
    if (localParts.length > 2 && remoteParts.length > 2) {
      const localPatch = parseInt(localParts[2]);
      const remotePatch = parseInt(remoteParts[2]);
      return remotePatch > localPatch;
    }

    return false;
  } catch (error) {
    console.error("版本号比较出错:", error);
    return false;
  }
};

// 添加计算属性来判断当前选中的插件是否有更新
const hasUpdate = computed(() => {
  if (!selectedPlugin.value || !isPluginInstalled(selectedPlugin.value)) {
    return false;
  }

  const installedPlugin = installedPlugins.value.find(
    (p) => p.WindowId === selectedPlugin.value?.WindowId,
  );

  if (!installedPlugin) {
    return false;
  }

  return checkPluginUpdate(
    installedPlugin.Version,
    selectedPlugin.value.Version,
  );
});

/** 显示插件详情 */
const showPluginDetail = async (pluginDetail: PluginDetail | Plugin) => {
  // 处理已安装插件的情况
  if ("Plugin" in pluginDetail) {
    // 处理插件市场的情况
    const detail = pluginDetail as PluginDetail;
    // 查找已安装插件中是否存在该插件，如果存在则获取安装时间
    const installedPlugin = installedPlugins.value.find(
      (p) => p.WindowId === detail.Plugin.WindowId,
    );
    selectedPlugin.value = {
      ...detail.Plugin,
      installTime: installedPlugin?.installTime,
    };
    selectedPluginIsRated.value = detail.IsRated;
    userRating.value = detail.Plugin.Rating || 0;
  } else {
    // 处理已安装插件的情况
    const plugin = pluginDetail as Plugin;
    const matchedPlugin = plugins.value.find(
      (p) => p.Plugin.WindowId === plugin.WindowId,
    );
    if (matchedPlugin) {
      selectedPlugin.value = {
        ...matchedPlugin.Plugin,
        installTime: plugin.installTime,
      };
      selectedPluginIsRated.value = matchedPlugin.IsRated;
      userRating.value = matchedPlugin.Plugin.Rating || 0;
    } else {
      selectedPlugin.value = plugin;
      selectedPluginIsRated.value = false;
      userRating.value = plugin.Rating || 0;
    }
  }
  showDetail.value = true;
};

/** 关闭详情 */
const closeDetail = () => {
  showDetail.value = false;
  userRating.value = 0;
};

/** 获取已安装插件列表 */
const getInstalledPlugins = async () => {
  try {
    showLoading();
    const config = await getPluginConfig(["pluginList"]);
    if (config && Array.isArray(config)) {
      installedPluginIds.value = config.map((item) => item.windowId);
      installedPlugins.value = config.map((item) => ({
        Id: -1, // 本地插件没有 Id
        Name: item.data.title,
        Message: null,
        Screenshots: [],
        WindowId: item.windowId,
        Title: item.data.title,
        Size: item.data.size,
        Position: item.data.position,
        AlwaysOnTop: item.data.alwaysOnTop,
        Resizable: item.data.resizable,
        Icon: item.data.icon,
        Status: item.info.status,
        CreateTime: item.info.createTime,
        Author: item.info.author,
        Email: item.info.email,
        Version: item.info.version,
        Description: item.info.description,
        Downloads: item.info.downloads,
        Rating: item.info.rating,
        Tags: item.info.tags,
        Category: item.info.category,
        UpdateTime: item.info.updateTime,
        FileUrl: "", // 添加 FileUrl 字段
        installTime: item.info.installTime, // 添加 installTime 字段
        config: item.config || {}, // 如果 config 为空，保持空对象
      }));
    } else {
      installedPluginIds.value = [];
      installedPlugins.value = [];
    }
  } catch (error) {
    console.error("获取已安装插件列表失败:", error);
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "获取已安装插件列表失败",
      life: 3000,
    });
    installedPluginIds.value = [];
    installedPlugins.value = [];
  } finally {
    hideLoading();
  }
};

/** 下载或更新插件 */
const handleDownload = async (
  plugin: Plugin | null,
  isUpdate: boolean = false,
) => {
  if (!plugin?.WindowId) return;

  try {
    showLoading();
    const response = await downloadPlugin({
      WindowId: plugin.WindowId,
      IsUpdate: isUpdate,
    });

    if (response.Code !== ResponseCodeEnum.SUCCESS || !response.Data) {
      throw new Error("下载链接获取失败");
    }

    await installPlugin(response.Data.toString(), plugin.WindowId);

    if (plugin) {
      const currentConfig = (await getPluginConfig(["pluginList"])) || [];
      const pluginList = Array.isArray(currentConfig) ? currentConfig : [];
      const appDataPath = await appDataDir();

      // 构建正确的插件配置结构
      const pluginConfig = {
        windowId: plugin.WindowId,
        data: {
          windowId: plugin.WindowId,
          title: plugin.Title,
          size: plugin.Size as [number, number],
          position: plugin.Position as [number, number],
          alwaysOnTop: plugin.AlwaysOnTop,
          resizable: plugin.Resizable,
          icon: plugin.Icon || "./icon.png",
          url: `${appDataPath}/Plugin/${plugin.WindowId}/index.html`,
        },
        config: {
          isEnabled: true, // 默认启用
        },
        info: {
          installTime: format(new Date(), "yyyy-MM-dd HH:mm"),
          status: PluginStatus.PUBLISHED,
          author: plugin.Author,
          email: plugin.Email,
          version: plugin.Version,
          description: plugin.Description,
          tags: plugin.Tags,
          category: plugin.Category,
          createTime: plugin.CreateTime,
          updateTime: plugin.UpdateTime,
        },
      };

      const index = pluginList.findIndex((p) => p.windowId === plugin.WindowId);
      if (index !== -1) {
        pluginList[index] = pluginConfig;
      } else {
        pluginList.push(pluginConfig);
      }

      await setPluginConfig(["pluginList"], pluginList);
    }

    toast.add({
      severity: "success",
      summary: "成功",
      detail: `插件${isUpdate ? "更新" : "下载"}成功`,
      life: 3000,
    });
    closeDetail();
    await getInstalledPlugins();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail:
        error instanceof Error
          ? error.message
          : `插件${isUpdate ? "更新" : "下载"}失败`,
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 评分 */
const handleRating = async (event: { value: number }) => {
  try {
    const userData = await GlobalData.get("userInfo");
    if (!userData?.Token) {
      toast.add({
        severity: "warn",
        summary: "提示",
        detail: "请先登录后再评分",
        life: 3000,
      });
      userRating.value = selectedPlugin.value?.Rating || 0;
      return;
    }

    if (!selectedPlugin.value?.WindowId) return;

    // 检查是否已安装插件
    if (!installedPluginIds.value.includes(selectedPlugin.value.WindowId)) {
      toast.add({
        severity: "warn",
        summary: "提示",
        detail: "请先安装插件后再评分",
        life: 3000,
      });
      userRating.value = selectedPlugin.value.Rating;
      return;
    }

    showLoading();
    const response = await ratePlugin(
      selectedPlugin.value.WindowId,
      event.value,
    );
    if (response.Code !== ResponseCodeEnum.SUCCESS) {
      toast.add({
        severity: "warn",
        summary: "提示",
        detail: response.Message || "评分失败",
        life: 3000,
      });
      userRating.value = selectedPlugin.value.Rating;
      return;
    }
    // 更新本地插件的评分
    if (selectedPlugin.value) {
      selectedPlugin.value.Rating = event.value;
      userRating.value = event.value;
      selectedPluginIsRated.value = true;
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
    userRating.value = selectedPlugin.value?.Rating || 0;
  } finally {
    hideLoading();
  }
};

/** 切换插件状态 */
const togglePlugin = async (plugin: Plugin, enable: boolean) => {
  if (!plugin.WindowId) return;

  try {
    showLoading();
    // 获取当前配置
    const currentConfig = await getPluginConfig(["pluginList"]);
    if (!currentConfig || !Array.isArray(currentConfig)) {
      throw new Error("获取插件配置失败");
    }

    // 更新插件状态
    const updatedConfig = currentConfig.map((item) => {
      if (item.windowId === plugin.WindowId) {
        return {
          ...item,
          config: {
            ...item.config,
            isEnabled: enable,
          },
        };
      }
      return item;
    });

    // 保存更新后的配置
    await setPluginConfig(["pluginList"], updatedConfig);

    toast.add({
      severity: "success",
      summary: "成功",
      detail: `插件${enable ? "启用" : "禁用"}成功`,
      life: 3000,
    });
    await getInstalledPlugins(); // 刷新已安装插件列表
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

const isPluginInstalled = (plugin: Plugin | null) => {
  if (!plugin) return false;
  return installedPluginIds.value.includes(plugin.WindowId);
};

const formatDate = (date: string, isDetail: boolean = false) => {
  if (!date) return false;
  return isDetail
    ? format(new Date(date), "yyyy-MM-dd HH:mm")
    : format(new Date(date), "yyyy-MM-dd");
};

/** 卸载插件 */
const uninstallPlugin = async (plugin: Plugin, event?: Event) => {
  if (!plugin?.WindowId) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "插件卸载失败",
      life: 3000,
    });
    return;
  }

  confirm.require({
    target: event?.currentTarget as HTMLElement,
    message: `确定要卸载插件 "${plugin.Name}" 吗？`,
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "确定",
    rejectLabel: "取消",
    accept: async () => {
      try {
        showLoading();
        await ipcUninstallPlugin(plugin.WindowId);
        // 直接设置新的配置，过滤掉要卸载的插件
        await setPluginConfig(
          ["pluginList"],
          installedPlugins.value.filter(
            (item) => item.WindowId !== plugin.WindowId,
          ),
        );

        toast.add({
          severity: "success",
          summary: "成功",
          detail: "插件卸载成功",
          life: 3000,
        });
        await initializeData();
        await getInstalledPlugins();
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "错误",
          detail: "插件卸载失败",
          life: 3000,
        });
      } finally {
        hideLoading();
      }
    },
  });
};

/** 显示已安装插件列表 */
const handleShowInstalled = async () => {
  showInstalled.value = true;
  await getInstalledPlugins();
};

/** 清空搜索 */
const clearSearch = () => {
  state.keyword = "";
  handleSearch();
};

/** 处理时间筛选变化 */
const handleTimeFilterChange = (event: { value: string }) => {
  state.timeFilter = event.value;
  state.pageIndex = 1; // 重置分页到第一页
  initializeData();
};

/** 初始化 */
onMounted(async () => {
  userData.value = await GlobalData.get("userInfo");
  await initializeData();
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
        padding-right: 5rem;
      }

      .clear-button {
        position: absolute;
        right: 2.5rem;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        padding: 0.5rem;
        color: #6b7280;
        z-index: 1;

        &:hover {
          color: #1a73e8;
        }
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
          width: 100px;
        }

        p {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      }

      .plugin-stats {
        text-align: right;

        .no-rating {
          color: #6b7280;
          font-size: 0.875rem;
        }

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
      background-color: var(--surface-50);
      border-radius: 8px;
      padding: 1.5rem;

      h3 {
        margin-bottom: 1.5rem;
        color: var(--text-color);
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
            color: var(--primary-color);
            margin-top: 3px;
          }

          .info-content {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .label {
              color: var(--text-color-secondary);
              font-size: 0.875rem;
            }

            .value {
              color: var(--text-color);
              font-weight: 500;

              .latest-version {
                color: var(--primary-color);
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
