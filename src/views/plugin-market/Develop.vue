<template>
  <div class="plugin-develop">
    <i class="pi pi-times close close-button" @click="handleClose"></i>

    <!-- 左侧边栏 -->
    <DevelopSidebar
      :active-menu="activeMenu"
      @go-back="goBack"
      @menu-click="handleMenuClick" />

    <!-- 添加调试按钮 -->
    <div class="debug-button" v-if="isDev">
      <Button
        icon="pi pi-hammer"
        label="插件调试"
        text
        @click="
          () => {
            ipcCreateNewWindow(WINDOW_CONFIG[NewWindowEnum.MhPlugin]);
          }
        "
        class="debug-link" />
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-header" v-window-drag>
        <h2>{{ MENU_TITLES[activeMenu] }}</h2>
        <Button
          v-if="activeMenu === MenuKey.MyPlugins"
          label="上传插件"
          icon="pi pi-upload"
          @click="showPluginDialog = true" />
      </div>

      <DataTable
        :value="getCurrentData()"
        selectionMode="single"
        class="content-table"
        @rowClick="onRowClick">
        <Column field="Name" header="插件名称">
          <template #body="{ data }">
            <div class="plugin-name">
              <span>{{ data.Name }}</span>
              <Tag
                v-if="activeMenu === MenuKey.MyPlugins"
                :value="STATUS_MAP[data.Status]"
                :severity="getStatusSeverity(data.Status)" />
              <Tag
                v-if="activeMenu === MenuKey.MyPlugins && data.HasUpdate"
                value="有更新"
                severity="warning"
                class="ml-2" />
            </div>
          </template>
        </Column>
        <Column field="Version" header="版本" style="width: 100px" />
        <Column
          v-if="activeMenu === MenuKey.MyPlugins"
          field="Category"
          header="分类"
          style="width: 120px">
          <template #body="{ data }">
            {{ getCategoryName(data.Category) }}
          </template>
        </Column>
        <Column
          v-if="activeMenu === MenuKey.MyPlugins"
          field="Downloads"
          header="下载次数"
          style="width: 100px" />
        <Column
          v-if="activeMenu === MenuKey.UploadHistory"
          field="Status"
          header="状态"
          style="width: 120px">
          <template #body="{ data }">
            <Tag
              :value="STATUS_MAP[data.Status]"
              :severity="getStatusSeverity(data.Status)" />
          </template>
        </Column>
        <Column
          v-if="activeMenu === MenuKey.UploadHistory"
          field="Message"
          header="审核消息"
          style="width: 200px">
          <template #body="{ data }">
            <span :class="{ 'error-text': data.Status === 2 }">
              {{ data.Message || "-" }}
            </span>
          </template>
        </Column>
        <Column
          v-if="activeMenu === MenuKey.UploadHistory"
          field="CreateTime"
          header="上传时间"
          style="width: 180px" />
        <Column
          v-else
          field="updateTime"
          header="更新时间"
          style="width: 200px">
          <template #body="{ data }">
            {{ data.UpdateTime }}
          </template>
        </Column>
        <Column
          v-if="activeMenu === MenuKey.MyPlugins"
          header="操作"
          style="width: 150px">
          <template #body="{ data }">
            <Button
              icon="pi pi-pencil"
              class="p-button-text"
              @click="editPlugin(data)"
              v-tooltip.top="getEditTooltip()" />
            <Button
              icon="pi pi-trash"
              class="p-button-text p-button-danger"
              @click="($event) => confirmDelete(data, $event)"
              v-tooltip.top="getDeleteTooltip()" />
          </template>
        </Column>
      </DataTable>

      <!-- 修改分页器位置和样式 -->
      <div class="pagination">
        <Paginator
          :first="(currentPage - 1) * rowsPerPage"
          :rows="rowsPerPage"
          :totalRecords="totalRecords"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          :rowsPerPageOptions="[10, 20, 50]"
          @page="onPageChange" />
      </div>
    </div>

    <!-- 上传/编辑对话框 -->
    <PluginUploadDialog
      v-model:visible="showPluginDialog"
      :is-edit-mode="isEditMode"
      :plugin-form="pluginForm"
      :errors="errors"
      :category-options="categoryOptions"
      @close="closeDialog"
      @submit="isEditMode ? handleUpdatePlugin() : submitPlugin()"
      @file-drop="handleDrop"
      @file-select="handleFileSelect"
      @icon-select="handleIconSelect"
      @screenshot-select="handleScreenshotSelect"
      @screenshot-drop="handleScreenshotDrop"
      @trigger-file-input="triggerFileInput"
      @trigger-icon-input="triggerIconInput"
      @trigger-screenshot-input="triggerScreenshotInput"
      @remove-file="removeFile"
      @remove-screenshot="removeScreenshot"
      @update:form="updateForm" />

    <!-- 详情对话框 -->
    <DevelopDetailDialog
      v-model:visible="showDetailDialog"
      :selected-plugin="selectedPlugin"
      :active-menu="activeMenu" />

    <ConfirmPopup></ConfirmPopup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import { useRouter } from "vue-router";
import ConfirmPopup from "primevue/confirmpopup";
import { ipcWindowControl } from "@/api/ipc/window.api";
import { ResponseCodeEnum, WindowOperation } from "@/interface/enum";
import { NewWindowEnum, WINDOW_CONFIG } from "@/interface/windowEnum";
import { ipcCreateNewWindow } from "@/api/ipc/window.api";
import { isDev } from "@/utils/common";
import {
  createPlugin,
  updatePlugin,
  uploadPluginFile,
  getUploadHistory,
  getDeveloperPlugins,
  deletePlugin,
  uploadImage,
} from "@/api/network/plugin.api";
import { PluginStatus, PluginCategory } from "@/interface/plugin.d";
import { showLoading, hideLoading } from "@/composables/loading.ts";
import GlobalData from "@/utils/globalData";
import Paginator from "primevue/paginator";
import {
  MenuKey,
  STATUS_MAP,
  STATUS_SEVERITY_MAP,
  MENU_TITLES,
} from "@/interface/pluginMarket.d";
import type {
  DeveloperPlugin,
  PluginFormData,
  PluginFormErrors,
  CategoryOption,
  PluginUploadData,
  PluginUpdateData,
} from "@/interface/pluginMarket.d";

// 导入组件
import DevelopSidebar from "./components/DevelopSidebar.vue";
import PluginUploadDialog from "./components/PluginUploadDialog.vue";
import DevelopDetailDialog from "./components/DevelopDetailDialog.vue";

const toast = useToast();
const confirm = useConfirm();
const router = useRouter();

const activeMenu = ref<MenuKey>(0); // MenuKey.MyPlugins
const showPluginDialog = ref(false);
const showDetailDialog = ref(false);

// 分页相关的状态
const currentPage = ref(1);
const rowsPerPage = ref(10);
const totalRecords = ref(0);

// 修改 ref 定义
const pluginsData = ref<DeveloperPlugin[]>([]);
const uploadHistory = ref<DeveloperPlugin[]>([]);

// 表单状态
const pluginForm = ref<PluginFormData>({
  Name: "",
  Description: "",
  Version: "",
  Status: PluginStatus.REVIEWING,
  Tags: [],
  File: null,
  Icon: "",
  Screenshots: [],
  WindowId: "",
  Title: "",
  Size: [800, 600],
  Position: [-1, -1],
  AlwaysOnTop: false,
  Resizable: true,
  Category: PluginCategory.OTHER,
});

const selectedPlugin = ref<DeveloperPlugin | null>(null);
const editingPlugin = ref<DeveloperPlugin | null>(null);

// 简化为一个对象管理所有错误信息
const errors = ref<PluginFormErrors>({
  Name: "",
  Version: "",
  Description: "",
  WindowId: "",
  Title: "",
  Size: "",
  Position: "",
});

// 移除 showEditDialog，使 editingPlugin 判断是否为编辑模式
const isEditMode = computed(() => !!editingPlugin.value);

// 定义插件分类选项
const categoryOptions: CategoryOption[] = [
  { label: "开发工具", value: PluginCategory.DEVELOPMENT },
  { label: "效率工具", value: PluginCategory.EFFICIENCY },
  { label: "网络工具", value: PluginCategory.NETWORK },
  { label: "系统工具", value: PluginCategory.SYSTEM },
  { label: "娱乐工具", value: PluginCategory.ENTERTAINMENT },
  { label: "其他", value: PluginCategory.OTHER },
];

// 添加图标相关的引用
const iconInput = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const screenshotInput = ref<HTMLInputElement | null>(null);

/** 加载插件数据 */
const loadData = async () => {
  try {
    showLoading();
    const userData = await GlobalData.get("userInfo");

    if (!userData.Token) {
      toast.add({
        severity: "warn",
        summary: "提示",
        detail: "请先登录后再访问",
        life: 3000,
      });
      hideLoading();
      return;
    }

    switch (activeMenu.value) {
      case 0: // MenuKey.MyPlugins
        const response = await getDeveloperPlugins({
          pageIndex: currentPage.value,
          pageSize: rowsPerPage.value,
        });

        if (response.Code === ResponseCodeEnum.SUCCESS && response.Data) {
          pluginsData.value = response.Data as unknown as DeveloperPlugin[];
          totalRecords.value = response.Page.TotalRecords;
        }
        break;
      case 1: // MenuKey.UploadHistory
        const historyResponse = await getUploadHistory({
          pageIndex: currentPage.value,
          pageSize: rowsPerPage.value,
        });

        if (
          historyResponse.Code === ResponseCodeEnum.SUCCESS &&
          historyResponse.Data
        ) {
          uploadHistory.value =
            historyResponse.Data as unknown as DeveloperPlugin[];
          totalRecords.value = historyResponse.Page.TotalRecords;
        }
        break;
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "加载数据失败",
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 获取插件状态对应的样式 */
const getStatusSeverity = (status: number) => {
  return STATUS_SEVERITY_MAP[status] || "info";
};

/** 关闭当前对话框并重置表单 */
const closeDialog = () => {
  showPluginDialog.value = false;
  editingPlugin.value = null;
  resetForm();
};

/** 重置表单数据和错误信息 */
const resetForm = () => {
  pluginForm.value = {
    Name: "",
    Description: "",
    Version: "",
    Status: PluginStatus.REVIEWING,
    Tags: [],
    File: null,
    Icon: "",
    Screenshots: [],
    WindowId: "",
    Title: "",
    Size: [800, 600],
    Position: [-1, -1],
    AlwaysOnTop: false,
    Resizable: true,
    Category: PluginCategory.OTHER,
  };
  errors.value = {
    Name: "",
    Version: "",
    Description: "",
    WindowId: "",
    Title: "",
    Size: "",
    Position: "",
  };
};

/** 编辑插件信息 */
const editPlugin = (plugin: DeveloperPlugin) => {
  editingPlugin.value = plugin;
  showPluginDialog.value = true;
  Object.assign(pluginForm.value, {
    ...plugin,
    File: null,
    Status: plugin.Status,
    Tags: plugin.Tags || [],
    Screenshots: plugin.Screenshots || [],
    Size: plugin.Size || [800, 600],
    Position: plugin.Position || [-1, -1],
    AlwaysOnTop: plugin.AlwaysOnTop ?? false,
    Resizable: plugin.Resizable ?? true,
    Category: plugin.Category ?? PluginCategory.OTHER,
  });
};

/** 更新表单字段 */
const updateForm = (data: { field: string; value: any }) => {
  (pluginForm.value as any)[data.field] = data.value;
};

/** 处理图标选择 */
const handleIconSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) {
    const file = input.files[0];
    try {
      showLoading();
      const response = await uploadImage(file, "avatar");
      if (response.Code === ResponseCodeEnum.SUCCESS && response.Data) {
        pluginForm.value.Icon = response.Data;
      } else {
        throw new Error(response.Message || "上传失败");
      }
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "上传失败",
        detail: error instanceof Error ? error.message : "图标上传失败",
        life: 3000,
      });
    } finally {
      hideLoading();
    }
  }
};

/** 触发图标选择对话框 */
const triggerIconInput = () => {
  iconInput.value?.click();
};

/** 验证表单字段 */
const validateField = (field: string, value: any) => {
  switch (field) {
    case "Name":
      return value ? "" : "请输入插件名称";
    case "Version":
      if (!value) return "请输入版本号";
      return /^\d+\.\d+\.\d+$/.test(value) ? "" : "版本号格式不正确，例如0.0.1";
    case "Description":
      return value ? "" : "请输入插件描述";
    case "WindowId":
      if (!value) return "请输入窗口ID";
      return /^[a-zA-Z][a-zA-Z0-9-_]*$/.test(value)
        ? ""
        : "窗口ID必须以字母开头，只能包含字母、数字、下划线和横线";
    case "Title":
      return value ? "" : "请输入窗口标题";
    default:
      return "";
  }
};

/** 验证整个表单 */
const validateForm = () => {
  let isValid = true;
  Object.keys(errors.value).forEach((key) => {
    const error = validateField(
      key,
      pluginForm.value[key as keyof typeof pluginForm.value],
    );
    errors.value[key as keyof typeof errors.value] = error;
    if (error) isValid = false;
  });
  return isValid;
};

/** 处理文件选择 */
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  validatePluginFile(file);
};

/** 关闭插件市场窗口 */
const handleClose = () => {
  ipcWindowControl(WindowOperation.Close, NewWindowEnum.PluginMarket);
};

/** 处理文件拖放 */
const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (!files?.length) return;

  validatePluginFile(files[0]);
};

/** 验证插件文件 */
const validatePluginFile = (file: File) => {
  // 检查文件扩展名
  const validExtensions = [".zip", ".rar", ".7z"];
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!validExtensions.includes(extension)) {
    toast.add({
      severity: "error",
      summary: "格式错误",
      detail: "仅支持 zip/rar/7z 格式的文件",
      life: 3000,
    });
    return false;
  }

  // 检查文件大小（15MB）
  if (file.size > 15 * 1024 * 1024) {
    toast.add({
      severity: "error",
      summary: "文件过大",
      detail: "文件大小不能超过15MB",
      life: 3000,
    });
    return false;
  }

  // 检查文件名长度
  if (file.name.length > 50) {
    toast.add({
      severity: "error",
      summary: "文件名过长",
      detail: "文件名不能超过50个字符",
      life: 3000,
    });
    return false;
  }

  // 验证通过，保存文件
  pluginForm.value.File = file;
  return true;
};

/** 移除已选择的文件 */
const removeFile = () => {
  pluginForm.value.File = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

/** 触发文件选择对话框 */
const triggerFileInput = () => {
  fileInput.value?.click();
};

/** 提交插件表单 */
const submitPlugin = async () => {
  if (!validateForm()) {
    return;
  }

  if (!pluginForm.value.File && !isEditMode.value) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "请选择插件文件",
      life: 3000,
    });
    return;
  }

  try {
    showLoading();

    // 1. 先上传插件文件
    let fileResponse;
    try {
      fileResponse = await uploadPluginFile(pluginForm.value.File as File);
      if (fileResponse.Code !== ResponseCodeEnum.SUCCESS) {
        throw new Error(fileResponse.Message || "上传插件文件失败");
      }
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "错误",
        detail: error instanceof Error ? error.message : "上传插件文件失败",
        life: 3000,
      });
      hideLoading();
      return;
    }

    // 2. 创建插件信息
    const pluginData: PluginUploadData = {
      Name: pluginForm.value.Name,
      Description: pluginForm.value.Description,
      Version: pluginForm.value.Version,
      Tags: pluginForm.value.Tags,
      Icon: pluginForm.value.Icon,
      Screenshots: pluginForm.value.Screenshots,
      WindowId: pluginForm.value.WindowId,
      Title: pluginForm.value.Title,
      Size: pluginForm.value.Size,
      Position: pluginForm.value.Position,
      AlwaysOnTop: pluginForm.value.AlwaysOnTop,
      Resizable: pluginForm.value.Resizable,
      FileUrl: fileResponse.Data,
      Category: pluginForm.value.Category,
    };

    const response = await createPlugin(pluginData);

    if (response.Code === ResponseCodeEnum.SUCCESS) {
      toast.add({
        severity: "success",
        summary: "成功",
        detail: "插件上传成功",
        life: 3000,
      });
      closeDialog();
      loadData(); // 重新加载列表
    } else {
      throw new Error(response.Message);
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: error instanceof Error ? error.message : "插件上传失败",
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 更新插件信息 */
const handleUpdatePlugin = async () => {
  if (!validateForm()) {
    return;
  }

  // 显示确认对话框
  confirm.require({
    message: "确定要保存修改吗？这将会覆盖原有插件",
    header: "确认保存",
    icon: "pi pi-exclamation-triangle",
    acceptLabel: "确定",
    rejectLabel: "取消",
    accept: async () => {
      try {
        showLoading();

        let fileUrl = undefined;

        // 如果有新文件，先上传
        if (pluginForm.value.File) {
          const fileResponse = await uploadPluginFile(pluginForm.value.File);
          fileUrl = fileResponse.Data;
        }

        const updateData: PluginUpdateData = {
          Id: editingPlugin.value?.Id || 0,
          Name: pluginForm.value.Name,
          Description: pluginForm.value.Description,
          Version: pluginForm.value.Version,
          Tags: pluginForm.value.Tags,
          Icon: pluginForm.value.Icon,
          Screenshots: pluginForm.value.Screenshots,
          WindowId: pluginForm.value.WindowId,
          Title: pluginForm.value.Title,
          Size: pluginForm.value.Size,
          Position: pluginForm.value.Position,
          AlwaysOnTop: pluginForm.value.AlwaysOnTop,
          Resizable: pluginForm.value.Resizable,
          FileUrl: fileUrl || "", // 确保类型安全
          Category: pluginForm.value.Category,
        };

        const response = await updatePlugin(
          pluginForm.value.WindowId,
          updateData,
        );

        if (response.Code === ResponseCodeEnum.SUCCESS) {
          toast.add({
            severity: "success",
            summary: "成功",
            detail: "插件更新成功",
            life: 3000,
          });
          closeDialog();
          loadData(); // 重新加载列表
        } else {
          throw new Error(response.Message);
        }
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "错误",
          detail: error instanceof Error ? error.message : "插件更新失败",
          life: 3000,
        });
      } finally {
        hideLoading();
      }
    },
  });
};

/** 处理分页变化 */
const onPageChange = (event: { page: number; rows: number }) => {
  currentPage.value = event.page + 1; // PrimeVue 的 page 是从 0 开始的
  rowsPerPage.value = event.rows;
  loadData();
};

/** 确认删除插件 */
const confirmDelete = (plugin: any, event: { currentTarget: any }) => {
  confirm.require({
    target: event.currentTarget,
    message: `确定要删除插件 "${plugin.Name}" 吗？`,
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "取消",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "确定",
    },
    accept: () => {
      handleDeletePlugin(plugin);
    },
    reject: () => {
      return;
    },
  });
};

/** 删除插件 */
const handleDeletePlugin = async (plugin: any) => {
  if (!plugin?.WindowId) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "插件ID无效",
      life: 3000,
    });
    return;
  }

  try {
    showLoading();

    await deletePlugin(plugin.WindowId);

    toast.add({
      severity: "success",
      summary: "成功",
      detail: "插件已删除",
      life: 3000,
    });
    await loadData(); // 重新加载列表
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: error instanceof Error ? error.message : "删除插件失败",
      life: 3000,
    });
  } finally {
    hideLoading();
  }
};

/** 处理菜单点击 */
const handleMenuClick = (menuKey: MenuKey) => {
  activeMenu.value = menuKey;
  loadData(); // 切换菜单时加载数据
};

/** 返回上一页 */
const goBack = () => {
  router.back();
};

/** 获取当前数据列表 */
const getCurrentData = () => {
  switch (activeMenu.value) {
    case 0: // MenuKey.MyPlugins
      return pluginsData.value;
    case 1: // MenuKey.UploadHistory
      return uploadHistory.value;
    default:
      return [];
  }
};

/** 获取编辑按钮的提示文本 */
const getEditTooltip = () => {
  return activeMenu.value === 0 ? "编辑插件" : "";
};

/** 获取删除按钮的提示文本 */
const getDeleteTooltip = () => {
  return activeMenu.value === 0 ? "删除插件" : "";
};

/** 处理截图选择 */
const handleScreenshotSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const files = Array.from(input.files)
    .filter((file) => file.type.startsWith("image/"))
    .slice(0, 5 - pluginForm.value.Screenshots.length);

  try {
    showLoading();
    for (const file of files) {
      try {
        const response = await uploadImage(file, "screenshot");
        if (response.Code === ResponseCodeEnum.SUCCESS && response.Data) {
          pluginForm.value.Screenshots.push(response.Data);
        }
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "上传失败",
          detail: `文件 ${file.name} 上传失败：${error instanceof Error ? error.message : "未知错误"}`,
          life: 3000,
        });
      }
    }
  } finally {
    hideLoading();
  }
};

/** 处理截图拖放 */
const handleScreenshotDrop = (event: DragEvent) => {
  const files = Array.from(event.dataTransfer?.files || []);
  processScreenshots(files);
};

/** 处理截图文件 */
const processScreenshots = async (files: File[]) => {
  // 过滤超出图片文件
  const imageFiles = files
    .filter((file) => file.type.startsWith("image/"))
    .slice(0, 5 - pluginForm.value.Screenshots.length);

  if (imageFiles.length === 0) return;

  try {
    showLoading();
    for (const file of imageFiles) {
      try {
        const response = await uploadImage(file, "screenshot");
        if (response.Code === ResponseCodeEnum.SUCCESS && response.Data) {
          pluginForm.value.Screenshots.push(response.Data);
        }
      } catch (error) {
        toast.add({
          severity: "error",
          summary: "上传失败",
          detail: `文件 ${file.name} 上传失败：${error instanceof Error ? error.message : "未知错误"}`,
          life: 3000,
        });
      }
    }
  } finally {
    hideLoading();
  }
};

/** 触发截图选择对话框 */
const triggerScreenshotInput = () => {
  screenshotInput.value?.click();
};

/** 移除指定截图 */
const removeScreenshot = (index: number) => {
  pluginForm.value.Screenshots.splice(index, 1);
};

/** 处理表格行点击 */
const onRowClick = (event: { data: DeveloperPlugin }) => {
  selectedPlugin.value = event.data;
  if (activeMenu.value === 1) {
    // MenuKey.UploadHistory
    // 上传记录的详情展示
    showDetailDialog.value = true;
  } else {
    // 我的插件的详情展示
    showDetailDialog.value = true;
  }
};

/** 获取分类名称 */
const getCategoryName = (category: number | undefined) => {
  const categoryOption = categoryOptions.find((c) => c.value === category);
  return categoryOption?.label || "未知分类";
};

// 初始化加载数据
onMounted(() => {
  loadData();
});
</script>

<style lang="less">
.plugin-develop {
  .error-text {
    color: var(--theme-error);
  }

  display: flex;
  height: 100vh;
  background-color: var(--theme-background);
  overflow: hidden;

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

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: var(--theme-background);

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid var(--theme-border);
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-weight: 600;
        color: var(--theme-text);
      }
    }

    .content-table {
      flex: 1;
      overflow: auto;
      padding: 0 2rem 2rem;

      :deep(.p-datatable-wrapper) {
        border-radius: 8px;
        border: 1px solid var(--theme-border);
        overflow: hidden;
      }

      :deep(.p-datatable-tbody > tr) {
        cursor: pointer;
      }

      :deep(.p-datatable-tbody > tr:hover) {
        background-color: var(--theme-background-secondary);
      }
    }

    .pagination {
      margin: 1rem 0;
      display: flex;
      justify-content: center;
      padding: 0 2rem;
    }
  }
}

.plugin-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.debug-button {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 100;

  .debug-link {
    &:hover {
      color: var(--theme-primary);
      background-color: var(--theme-background-secondary);
    }
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--theme-background-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--theme-border);
  border-radius: 4px;

  &:hover {
    background: var(--theme-text-muted);
  }
}
</style>

<style lang="less">
@import "../../assets/css/variable.less";
</style>
