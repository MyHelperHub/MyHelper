<template>
  <div class="plugin-market">
    <ConfirmPopup />
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    
    <!-- 顶部搜索区域 -->
    <PluginSearchArea
      v-model:keyword="state.keyword"
      @search="handleSearch"
      @clear-search="clearSearch"
      @show-installed="handleShowInstalled" />

    <!-- 主要内容区域 -->
    <div class="container main-content">
      <div class="content-wrapper">
        <!-- 左侧分类菜单 -->
        <PluginCategoryMenu
          :selected-category="state.category"
          :category-menu-items="categoryMenuItems"
          @select-category="selectCategory" />

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
            <PluginCard
              v-for="pluginDetail in plugins"
              :key="pluginDetail.Plugin.Id"
              :plugin-detail="pluginDetail"
              :installed-plugins="installedPlugins"
              :installed-plugin-ids="installedPluginIds"
              @click="showPluginDetail" />
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
    <PluginDetailDialog
      v-model:visible="showDetail"
      :selected-plugin="selectedPlugin"
      :selected-plugin-is-rated="selectedPluginIsRated"
      :user-rating="userRating"
      :user-data="userData"
      :installed-plugin-ids="installedPluginIds"
      :installed-plugins="installedPlugins"
      :has-update="hasUpdate"
      @close="closeDetail"
      @download="handleDownload"
      @rating-change="handleRating" />

    <!-- 已安装插件对话框 -->
    <InstalledPluginsDialog
      v-model:visible="showInstalled"
      :installed-plugins="installedPlugins"
      :plugins="plugins"
      @open-import-dialog="openImportDialog"
      @show-plugin-detail="showPluginDetail"
      @download-plugin="handleDownload"
      @toggle-plugin="togglePlugin"
      @uninstall-plugin="uninstallPlugin" />

    <!-- 添加开发者按钮 -->
    <div class="developer-button">
      <Button
        icon="pi pi-code"
        label="我是开发者"
        text
        @click="gotoDevelop"
        class="developer-link" />
    </div>

    <!-- 本地插件导入对话框 -->
    <LocalPluginImportDialog
      v-model:visible="showImportDialog"
      :local-plugin-file="localPluginFile"
      :local-plugin-info="localPluginInfo"
      @close="closeImportDialog"
      @import="importLocalPlugin"
      @open-file-selector="openFileSelector" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import Button from "primevue/button";
import Toolbar from "primevue/toolbar";
import Select from "primevue/select";
import Paginator from "primevue/paginator";
import { useRouter } from "vue-router";
import { showLoading, hideLoading } from "@/composables/loading.ts";
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
import {
  ipcUninstallPlugin,
  ipcInstallLocalPlugin,
  ipcAnalyzePluginPackage,
} from "@/api/ipc/plugin.api";
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
import type {
  PluginMarketState,
  LocalPluginFile,
  LocalPluginInfo,
  CategoryMenuItem,
  SortOption,
  TimeFilterOption,
  PluginAnalysisResult,
} from "@/interface/pluginMarket.d";
import { appDataDir } from "@tauri-apps/api/path";
import { format } from "date-fns";
import ConfirmPopup from "primevue/confirmpopup";
import GlobalData from "@/utils/globalData";
import { open } from "@tauri-apps/plugin-dialog";

// 导入组件
import PluginSearchArea from "./components/PluginSearchArea.vue";
import PluginCategoryMenu from "./components/PluginCategoryMenu.vue";
import PluginCard from "./components/PluginCard.vue";
import PluginDetailDialog from "./components/PluginDetailDialog.vue";
import InstalledPluginsDialog from "./components/InstalledPluginsDialog.vue";
import LocalPluginImportDialog from "./components/LocalPluginImportDialog.vue";

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
const showImportDialog = ref(false);
const localPluginFile = ref<LocalPluginFile | null>(null);
const localPluginInfo = ref<LocalPluginInfo>({
  windowId: "",
  title: "",
  description: "",
});

// 状态管理
const state = reactive<PluginMarketState>({
  keyword: "",
  category: "ALL",
  sort: PluginSortType.SMART,
  timeFilter: "all",
  pageIndex: 1,
  pageSize: 20,
  total: 0,
});

// 分类选项
const categoryMenuItems: CategoryMenuItem[] = [
  { label: "全部", value: "ALL" },
  { label: "开发工具", value: PluginCategory.DEVELOPMENT },
  { label: "效率工具", value: PluginCategory.EFFICIENCY },
  { label: "网络工具", value: PluginCategory.NETWORK },
  { label: "系统工具", value: PluginCategory.SYSTEM },
  { label: "娱乐工具", value: PluginCategory.ENTERTAINMENT },
  { label: "其他", value: PluginCategory.OTHER },
];

// 排序选项
const sortOptions: SortOption[] = [
  { label: "智能排序", value: PluginSortType.SMART },
  { label: "下载量（从高到低）", value: PluginSortType.DOWNLOADS_DESC },
  { label: "下载量（从低到高）", value: PluginSortType.DOWNLOADS_ASC },
  { label: "评分（从高到低）", value: PluginSortType.RATING_DESC },
  { label: "评分（从低到高）", value: PluginSortType.RATING_ASC },
  { label: "更新时间（最新）", value: PluginSortType.UPDATE_TIME_DESC },
  { label: "更新时间（最早）", value: PluginSortType.UPDATE_TIME_ASC },
];

// 时间筛选选项
const timeFilterOptions: TimeFilterOption[] = [
  { label: "所有时间", value: "all" },
  { label: "最近一周", value: "week" },
  { label: "最近一月", value: "month" },
  { label: "最近一年", value: "year" },
];

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

// 初始化数据
const initializeData = async () => {
  try {
    showLoading();
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

// 搜索插件
const handleSearch = () => {
  state.pageIndex = 1;
  initializeData();
};

// 处理分页变化
const onPageChange = (event: { page: number; rows: number }) => {
  state.pageIndex = event.page + 1;
  state.pageSize = event.rows;
  initializeData();
};

// 选择分类
const selectCategory = (category: string) => {
  state.category = category;
  state.pageIndex = 1;
  initializeData();
};

// 处理排序变化
const handleSortChange = (event: { value: PluginSortType }) => {
  state.sort = event.value;
  state.pageIndex = 1;
  initializeData();
};

// 检查插件是否有更新
const checkPluginUpdate = (localVersion?: string, remoteVersion?: string) => {
  if (!localVersion || !remoteVersion) {
    return false;
  }

  try {
    const localParts = localVersion.split(".");
    const remoteParts = remoteVersion.split(".");

    const localMajor = parseInt(localParts[0]);
    const remoteMajor = parseInt(remoteParts[0]);
    if (remoteMajor > localMajor) return true;
    if (remoteMajor < localMajor) return false;

    if (localParts.length > 1 && remoteParts.length > 1) {
      const localMinor = parseInt(localParts[1]);
      const remoteMinor = parseInt(remoteParts[1]);
      if (remoteMinor > localMinor) return true;
      if (remoteMinor < localMinor) return false;
    }

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

// 显示插件详情
const showPluginDetail = async (pluginDetail: PluginDetail | Plugin) => {
  if ("Plugin" in pluginDetail) {
    const detail = pluginDetail as PluginDetail;
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

// 关闭详情
const closeDetail = () => {
  showDetail.value = false;
  userRating.value = 0;
};

// 获取已安装插件列表
const getInstalledPlugins = async () => {
  try {
    showLoading();
    const config = await getPluginConfig(["pluginList"]);
    if (config && Array.isArray(config)) {
      installedPluginIds.value = config.map((item) => item.windowId);
      installedPlugins.value = config.map((item) => ({
        Id: -1,
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
        FileUrl: "",
        installTime: item.info.installTime,
        config: item.config || {},
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

// 下载或更新插件
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
          isEnabled: true,
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

// 评分
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

    if (selectedPlugin.value.Id === -1) {
      toast.add({
        severity: "warn",
        summary: "提示",
        detail: "本地导入的插件不允许评分",
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

// 切换插件状态
const togglePlugin = async (plugin: Plugin, enable: boolean) => {
  if (!plugin.WindowId) return;

  try {
    showLoading();
    const currentConfig = await getPluginConfig(["pluginList"]);
    if (!currentConfig || !Array.isArray(currentConfig)) {
      throw new Error("获取插件配置失败");
    }

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

    await setPluginConfig(["pluginList"], updatedConfig);

    toast.add({
      severity: "success",
      summary: "成功",
      detail: `插件${enable ? "启用" : "禁用"}成功`,
      life: 3000,
    });
    await getInstalledPlugins();
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

// 跳转开发者页面
const gotoDevelop = () => {
  router.push("/develop");
};

// 关闭窗口
const handleClose = () => {
  ipcWindowControl(WindowOperation.Close, {
    window_id: NewWindowEnum.PluginMarket,
  });
};

const isPluginInstalled = (plugin: Plugin | null) => {
  if (!plugin) return false;
  return installedPluginIds.value.includes(plugin.WindowId);
};

// 卸载插件
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

// 显示已安装插件列表
const handleShowInstalled = async () => {
  showInstalled.value = true;
  await getInstalledPlugins();
};

// 打开导入对话框
const openImportDialog = () => {
  localPluginFile.value = null;
  localPluginInfo.value = {
    windowId: "",
    title: "",
    description: "",
  };
  showImportDialog.value = true;
};

// 关闭导入对话框
const closeImportDialog = () => {
  showImportDialog.value = false;
  localPluginFile.value = null;
};

// 打开文件选择器
const openFileSelector = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "ZIP文件",
          extensions: ["zip"],
        },
      ],
    });

    if (!selected) return;

    await analyzePluginPackage(selected as string);
  } catch (error) {
    console.error("选择文件失败:", error);
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "选择文件失败",
      life: 3000,
    });
  }
};

// 解析插件包
const analyzePluginPackage = async (filePath: string) => {
  try {
    showLoading();
    const result = (await ipcAnalyzePluginPackage(filePath)) as PluginAnalysisResult;

    if (!result || !result.success) {
      throw new Error(result?.message || "解析插件包失败");
    }

    const fileName = filePath.split(/[\/\\]/).pop() || "";
    localPluginFile.value = {
      path: filePath,
      name: fileName,
      size: result.size || 0,
    };

    localPluginInfo.value = {
      windowId: result.pluginInfo.windowId || "",
      title: result.pluginInfo.name || "",
      description: result.pluginInfo.description || "",
      version: result.pluginInfo.version,
      author: result.pluginInfo.author,
      email: result.pluginInfo.email,
      tags: result.pluginInfo.tags,
      category: result.pluginInfo.category,
      size: result.pluginInfo.size,
      position: result.pluginInfo.position,
      alwaysOnTop: result.pluginInfo.alwaysOnTop,
      resizable: result.pluginInfo.resizable,
      icon: result.pluginInfo.icon,
    };
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: error instanceof Error ? error.message : "解析插件包失败",
      life: 3000,
    });
    localPluginFile.value = null;
  } finally {
    hideLoading();
  }
};

// 导入本地插件
const importLocalPlugin = async () => {
  if (!localPluginFile.value || !localPluginInfo.value.windowId) return;

  try {
    showLoading();

    await ipcInstallLocalPlugin(
      localPluginFile.value.path,
      localPluginInfo.value.windowId,
    );

    const currentConfig = (await getPluginConfig(["pluginList"])) || [];
    const pluginList = Array.isArray(currentConfig) ? currentConfig : [];
    const appDataPath = await appDataDir();

    const pluginConfig = {
      windowId: localPluginInfo.value.windowId,
      data: {
        windowId: localPluginInfo.value.windowId,
        title: localPluginInfo.value.title,
        size: localPluginInfo.value.size || [800, 600],
        position: localPluginInfo.value.position || [-1, -1],
        alwaysOnTop: localPluginInfo.value.alwaysOnTop || false,
        resizable: localPluginInfo.value.resizable !== false,
        icon: localPluginInfo.value.icon || "./icon.png",
        url: `${appDataPath}/Plugin/${localPluginInfo.value.windowId}/index.html`,
      },
      config: {
        isEnabled: true,
      },
      info: {
        installTime: format(new Date(), "yyyy-MM-dd HH:mm"),
        status: PluginStatus.PUBLISHED,
        author: localPluginInfo.value.author || "本地导入",
        email: localPluginInfo.value.email || "",
        version: localPluginInfo.value.version || "1.0.0",
        description: localPluginInfo.value.description || "本地导入的插件",
        downloads: 0,
        rating: 0,
        tags: localPluginInfo.value.tags || ["本地导入"],
        category: localPluginInfo.value.category || PluginCategory.OTHER,
        createTime: format(new Date(), "yyyy-MM-dd HH:mm"),
        updateTime: format(new Date(), "yyyy-MM-dd HH:mm"),
      },
    };

    const index = pluginList.findIndex(
      (p) => p.windowId === localPluginInfo.value.windowId,
    );
    if (index !== -1) {
      pluginList[index] = pluginConfig;
    } else {
      pluginList.push(pluginConfig);
    }

    await setPluginConfig(["pluginList"], pluginList);

    toast.add({
      severity: "success",
      summary: "成功",
      detail: "本地插件导入成功",
      life: 3000,
    });

    closeImportDialog();
    await getInstalledPlugins();
  } catch (error) {
    console.error("导入本地插件失败:", error);
    toast.add({
      severity: "error",
      summary: "错误",
      detail: error instanceof Error ? error.message : "导入本地插件失败",
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

// 清空搜索
const clearSearch = () => {
  state.keyword = "";
  handleSearch();
};

// 处理时间筛选变化
const handleTimeFilterChange = (event: { value: string }) => {
  state.timeFilter = event.value;
  state.pageIndex = 1;
  initializeData();
};

// 初始化
onMounted(async () => {
  userData.value = await GlobalData.get("userInfo");
  await initializeData();
});
</script>

<style lang="less" scoped>
.plugin-market {
  min-height: 100vh;
  background-color: var(--theme-background-secondary);

  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    z-index: 5001;
    color: var(--theme-text-muted);
    font-size: 16px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--theme-text);
      transform: scale(1.1);
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
</style>

<style lang="less">
@import "../../assets/css/variable.less";
</style>