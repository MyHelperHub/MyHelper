<template>
  <div class="plugin-develop">
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="menu-header" data-tauri-drag-region>
        <Button
          icon="pi pi-arrow-left"
          class="p-button-text p-button-sm back-button"
          @click="goBack" />
        <span>开发者插件管理</span>
      </div>
      <div class="menu-items">
        <div
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: activeMenu === item.key }"
          @click="handleMenuClick(item.key as MenuKey)">
          <i :class="item.icon"></i>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- 添加调试按钮 -->
    <div class="debug-button" v-if="isDev">
      <Button
        icon="pi pi-hammer"
        label="插件调试"
        text
        @click="
          () => {
            ipcCreateNewWindow(WINDOW_CONFIG[NewWindowEnum.MhPlugin])
          }
        "
        class="debug-link" />
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-header" data-tauri-drag-region>
        <h2>{{ menuTitles[activeMenu] }}</h2>
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
                :value="statusMap[data.Status]"
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
              :value="statusMap[data.Status]"
              :severity="getStatusSeverity(data.Status)" />
          </template>
        </Column>
        <Column
          v-if="activeMenu === MenuKey.UploadHistory"
          field="Message"
          header="审核消息"
          style="width: 200px">
          <template #body="{ data }">
            <span :class="{ 'text-red-500': data.Status === 2 }">
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
    <Dialog
      v-model:visible="showPluginDialog"
      :header="isEditMode ? '编辑插件' : '上传插件'"
      :modal="true"
      class="w-[700px]"
      @hide="closeDialog">
      <div class="p-6 p-t-0">
        <!-- 基本信息 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-4">基本信息</h3>
          <div class="space-y-4">
            <!-- 上传区域 - 编辑模式也显示 -->
            <div
              class="border-2 border-dashed border-gray-200 rounded-lg p-8 mb-6 bg-gray-50 transition-all duration-300"
              :class="{ 'border-primary': isDragging }"
              @drop.prevent="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false">
              <input
                type="file"
                ref="fileInput"
                accept=".zip"
                class="hidden"
                @change="handleFileSelect" />

              <template v-if="!pluginForm.File">
                <div
                  class="text-center cursor-pointer p-8"
                  @click="triggerFileInput">
                  <i class="pi pi-cloud-upload text-4xl text-primary mb-4"></i>
                  <p class="text-lg mb-2">
                    {{
                      isEditMode
                        ? "点击或拖拽更新插件代码(可选)"
                        : "点击或拖拽上传插件包"
                    }}
                  </p>
                  <small v-if="isEditMode" class="text-red-400">若不更新插件代码，请勿上传<br/></small>
                  <small class="text-gray-500">支持 15MB 以内的 zip 文件</small>
                </div>
              </template>

              <template v-else>
                <div class="flex items-center p-4 bg-white rounded-lg">
                  <i class="pi pi-file-zip text-2xl text-primary mr-4"></i>
                  <div class="flex-1">
                    <span class="block font-medium">{{
                      pluginForm.File.name
                    }}</span>
                    <span class="text-sm text-gray-500">{{
                      formatFileSize(pluginForm.File.size)
                    }}</span>
                  </div>
                  <Button
                    icon="pi pi-times"
                    class="p-button-text"
                    @click="removeFile" />
                </div>
              </template>
            </div>

            <!-- 图标和名称并排 -->
            <div class="grid grid-cols-[120px_1fr] gap-4">
              <!-- 插件图标 -->
              <div>
                <label class="block mb-2">插件图标</label>
                <div
                  class="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                  <img
                    v-if="pluginForm.Icon"
                    :src="pluginForm.Icon"
                    class="w-full h-full object-cover" />
                  <i v-else class="pi pi-image text-3xl text-gray-400"></i>
                  <input
                    type="file"
                    ref="iconInput"
                    accept="image/*"
                    class="hidden"
                    @change="handleIconSelect" />
                  <div
                    class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      icon="pi pi-upload"
                      class="p-button-rounded p-button-text p-button-white"
                      @click="triggerIconInput" />
                  </div>
                </div>
              </div>

              <!-- 名称和版本 -->
              <div class="space-y-4">
                <div>
                  <label class="block mb-2"
                    >插件名称 <span class="text-red-500">*</span></label
                  >
                  <InputText
                    v-model="pluginForm.Name"
                    class="w-full"
                    :class="{ 'p-invalid': errors.Name }"
                    placeholder="请输入插件名称" />
                  <small class="text-red-500" v-if="errors.Name">{{
                    errors.Name
                  }}</small>
                </div>
                <div>
                  <label class="block mb-2"
                    >版本号 <span class="text-red-500">*</span></label
                  >
                  <InputText
                    v-model="pluginForm.Version"
                    class="w-full"
                    :class="{ 'p-invalid': errors.Version }"
                    placeholder="输入版本号: 1.0.0" />
                  <small class="text-red-500" v-if="errors.Version">{{
                    errors.Version
                  }}</small>
                </div>
              </div>
            </div>

            <!-- 描述和标签 -->
            <div>
              <label class="block mb-2"
                >插件描述 <span class="text-red-500">*</span></label
              >
              <Textarea
                v-model="pluginForm.Description"
                class="w-full"
                :class="{ 'p-invalid': errors.Description }"
                rows="3"
                placeholder="请输入插件描述" />
              <small class="text-red-500" v-if="errors.Description">{{
                errors.Description
              }}</small>
            </div>

            <div>
              <label class="block mb-2">标签</label>
              <InputChips
                v-model="pluginForm.Tags"
                class="w-full"
                placeholder="输入标签后按回车"
                :max="5"
                :allowDuplicate="false" />
              <small class="text-gray-500">最多添加5个标签</small>
            </div>
          </div>
        </div>

        <!-- 窗口配置 -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-4">窗口配置</h3>
          <div class="space-y-4">
            <!-- 窗口ID和标题 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-2"
                  >窗口ID <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="pluginForm.WindowId"
                  class="w-full"
                  :class="{ 'p-invalid': errors.WindowId }"
                  placeholder="请输入窗口ID" />
                <small class="text-red-500" v-if="errors.WindowId">{{
                  errors.WindowId
                }}</small>
              </div>
              <div>
                <label class="block mb-2"
                  >窗口标题 <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="pluginForm.Title"
                  class="w-full"
                  :class="{ 'p-invalid': errors.Title }"
                  placeholder="请输入窗口标题" />
                <small class="text-red-500" v-if="errors.Title">{{
                  errors.Title
                }}</small>
              </div>
            </div>

            <!-- 窗口大小 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-2"
                  >窗口宽度 <span class="text-red-500">*</span></label
                >
                <InputNumber
                  v-model="pluginForm.Size[0]"
                  class="w-full"
                  :min="200"
                  :max="2000"
                  placeholder="窗口宽度(px)" />
              </div>
              <div>
                <label class="block mb-2"
                  >窗口高度 <span class="text-red-500">*</span></label
                >
                <InputNumber
                  v-model="pluginForm.Size[1]"
                  class="w-full"
                  :min="200"
                  :max="2000"
                  placeholder="窗口高度(px)" />
              </div>
            </div>

            <!-- 窗口位置 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-2">
                  窗口位置X <span class="text-red-500">*</span>
                  <i
                    class="pi pi-question-circle ml-1 text-gray-400 cursor-help"
                    v-tooltip.top="'默认值 -1 表示窗口水平居中'" />
                </label>
                <InputNumber
                  :modelValue="pluginForm.Position?.[0] ?? -1"
                  @update:modelValue="(val) => updatePositionX(val)"
                  class="w-full"
                  placeholder="水平位置(逻辑像素)" />
                <small class="text-red-500" v-if="errors.Position">{{
                  errors.Position
                }}</small>
              </div>
              <div>
                <label class="block mb-2">
                  窗口置Y <span class="text-red-500">*</span>
                  <i
                    class="pi pi-question-circle ml-1 text-gray-400 cursor-help"
                    v-tooltip.top="'默认值 -1 表示窗口垂直居中'" />
                </label>
                <InputNumber
                  :modelValue="pluginForm.Position?.[1] ?? -1"
                  @update:modelValue="(val) => updatePositionY(val)"
                  class="w-full"
                  placeholder="垂直位置(逻辑像素)" />
              </div>
            </div>

            <!-- 窗口属性 -->
            <div class="flex gap-6">
              <div class="flex items-center">
                <Checkbox v-model="pluginForm.AlwaysOnTop" :binary="true" />
                <label class="ml-2">窗口置顶</label>
              </div>
              <div class="flex items-center">
                <Checkbox v-model="pluginForm.Resizable" :binary="true" />
                <label class="ml-2">允许调整大小</label>
              </div>
            </div>
          </div>
        </div>

        <!-- 截图预览 -->
        <div>
          <h3 class="text-lg font-medium mb-4">截图预览</h3>
          <div class="screenshot-upload">
            <!-- 预览区域 -->
            <div class="screenshot-preview">
              <div
                v-for="(screenshot, index) in pluginForm.Screenshots"
                :key="index"
                class="preview-item">
                <div class="image-container">
                  <Image :src="screenshot" preview />
                </div>
                <Button
                  icon="pi pi-times"
                  class="p-button-rounded p-button-danger p-button-text delete-btn"
                  @click="removeScreenshot(index)" />
              </div>

              <!-- 上传按钮 -->
              <div
                v-if="pluginForm.Screenshots.length < 5"
                class="upload-button"
                @drop.prevent="handleScreenshotDrop"
                @dragover.prevent="isDraggingScreenshot = true"
                @dragleave.prevent="isDraggingScreenshot = false"
                :class="{ dragging: isDraggingScreenshot }"
                @click="triggerScreenshotInput">
                <input
                  type="file"
                  ref="screenshotInput"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="handleScreenshotSelect" />
                <div class="upload-content">
                  <i class="pi pi-plus text-xl mb-1"></i>
                  <p class="text-sm">上传截图</p>
                  <small class="text-xs text-gray-500">最多5张</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-4">
          <Button label="取消" class="p-button-text" @click="closeDialog" />
          <Button
            :label="isEditMode ? '保存' : '上传'"
            :icon="isEditMode ? 'pi pi-save' : 'pi pi-upload'"
            @click="isEditMode ? handleUpdatePlugin() : submitPlugin()" />
        </div>
      </template>
    </Dialog>

    <!-- 详情对话框 -->
    <Dialog
      v-model:visible="showDetailDialog"
      :header="
        activeMenu === MenuKey.UploadHistory ? '上传记录详情' : '插件详情'
      "
      :modal="true"
      class="w-[700px]"
      dismissableMask>
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

    <ConfirmPopup></ConfirmPopup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Tag from "primevue/tag";
import Dialog from "primevue/dialog";
import { useRouter } from "vue-router";
import Image from "primevue/image";
import Rating from "primevue/rating";
import Carousel from "primevue/carousel";
import ConfirmPopup from "primevue/confirmpopup";
import InputNumber from "primevue/inputnumber";
import Checkbox from "primevue/checkbox";
import InputChips from "primevue/inputchips";
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
import { PluginStatus } from "@/interface/plugin.d";
import { showLoading, hideLoading } from "@/utils/loading";
import GlobalData from "@/utils/globalData";
import Paginator from "primevue/paginator";

const toast = useToast();
const confirm = useConfirm();

enum MenuKey {
  MyPlugins = 0, // 我的插件
  UploadHistory = 1, // 上传记录
}

const activeMenu = ref<MenuKey>(MenuKey.MyPlugins);
const showPluginDialog = ref(false);
const showDetailDialog = ref(false);
const isDragging = ref(false);

// 菜单配置
const MENU_ITEMS = [
  { key: MenuKey.MyPlugins, label: "我的插件", icon: "pi pi-list" },
  { key: MenuKey.UploadHistory, label: "上传记录", icon: "pi pi-history" },
] as const;

const menuTitles = {
  [MenuKey.MyPlugins]: "我的插件",
  [MenuKey.UploadHistory]: "上传记录",
};

const menuItems = ref(MENU_ITEMS);

// 修改状态映射
const statusMap: Record<number, string> = {
  0: "审核中",
  1: "已通过",
  2: "已驳回",
  3: "已停用",
};

// 分页相关的状态
const currentPage = ref(1);
const rowsPerPage = ref(10);
const totalRecords = ref(0);

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
      case MenuKey.MyPlugins:
        const response = await getDeveloperPlugins({
          pageIndex: currentPage.value,
          pageSize: rowsPerPage.value,
        });

        if (response.Code === ResponseCodeEnum.SUCCESS && response.Data) {
          pluginsData.value = response.Data as unknown as Plugin[];
          totalRecords.value = response.Page.TotalRecords;
        }
        break;
      case MenuKey.UploadHistory:
        const historyResponse = await getUploadHistory({
          pageIndex: currentPage.value,
          pageSize: rowsPerPage.value,
        });

        if (
          historyResponse.Code === ResponseCodeEnum.SUCCESS &&
          historyResponse.Data
        ) {
          uploadHistory.value = historyResponse.Data as unknown as Plugin[];
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

/**
 * 获取插件状态对应的样式
 * @param status - 插件状态值
 * @returns 对应的样式名称
 */
const getStatusSeverity = (status: number) => {
  const map: Record<number, string> = {
    0: "warning", // 审核中
    1: "success", // 已通过
    2: "danger", // 已驳回
    3: "danger", // 已停用
  };
  return map[status] || "info";
};

// 修改 Plugin 接口定义
interface Plugin {
  Id: number;
  Name: string;
  Description: string;
  Version: string;
  Status?: PluginStatus;
  Downloads?: number;
  CreateTime: string;
  UpdateTime: string;
  Author: string;
  Icon?: string;
  Tags?: string[];
  Rating?: number;
  Screenshots?: string[];
  WindowId?: string;
  Title?: string;
  Size?: [number, number];
  Position?: [number, number];
  AlwaysOnTop?: boolean;
  Resizable?: boolean;
  Message?: string;
  HasUpdate?: boolean;
  Category?: string;
  Email?: string;
}

// 修改 ref 定义
const pluginsData = ref<Plugin[]>([]);

const uploadHistory = ref<Plugin[]>([]);

// 表单状态
const pluginForm = ref({
  Name: "",
  Description: "",
  Version: "",
  Status: PluginStatus.REVIEWING,
  Tags: [] as string[],
  File: null as File | null,
  Icon: "" as string,
  Screenshots: [] as string[],
  WindowId: "",
  Title: "",
  Size: [800, 600] as [number, number],
  Position: [-1, -1] as [number, number],
  AlwaysOnTop: false,
  Resizable: true,
});

const selectedPlugin = ref<Plugin | null>(null);
const editingPlugin = ref<Plugin | null>(null);

// 简化为一个对象管理所有错误信息
const errors = ref({
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

// 更新模板的判断
// 将 showEditDialog 替换为 isEditMode
// 例如: :header="isEditMode ? '编辑插件' : '上传插件'"

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

/**
 * 编辑插件信息
 * @param plugin - 待编辑的插件对象
 */
const editPlugin = (plugin: Plugin) => {
  editingPlugin.value = plugin;
  showPluginDialog.value = true;
  Object.assign(pluginForm.value, {
    ...plugin,
    File: null,
    Status: plugin.Status,  // 保留原插件的状态
    Tags: plugin.Tags || [],
    Screenshots: plugin.Screenshots || [],
    Size: plugin.Size || [800, 600],
    Position: plugin.Position || [-1, -1],
    AlwaysOnTop: plugin.AlwaysOnTop ?? false,
    Resizable: plugin.Resizable ?? true,
  });
};

// 添加图标相关的引用
const iconInput = ref<HTMLInputElement | null>(null);

/**
 * 处理图标选择
 * @param event - 文件选择事件
 */
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

/**
 * 验证表单字段
 * @param field - 字段名称
 * @param value - 字段值
 * @returns 错误信息，验证通过返回空字符串
 */
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

// 监听上传时表单变化
watch(
  () => ({ ...pluginForm.value }),
  (newVal, oldVal) => {
    if (!oldVal) return;

    (Object.keys(errors.value) as Array<keyof typeof errors.value>).forEach(
      (key) => {
        if (
          newVal[key as keyof typeof newVal] !==
          oldVal[key as keyof typeof oldVal]
        ) {
          errors.value[key] = validateField(
            key,
            newVal[key as keyof typeof newVal],
          );
        }
      },
    );
  },
  { deep: true },
);

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

/**
 * 处理文件选择
 * @param event - 文件选择事件
 */
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

/**
 * 处理文件拖放
 * @param event - 拖放事件
 */
const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (!files?.length) return;

  validatePluginFile(files[0]);
};

/**
 * 验证插件文件
 * @param file - 待验证的文件
 * @returns 验证是否通过
 */
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

/**
 * 格式化文件大小
 * @param bytes - 文件字节大小
 * @returns 格式化后的文件大小字符串
 */
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const fileInput = ref<HTMLInputElement | null>(null);

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
    const pluginData = {
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
      FileUrl: fileResponse.Data
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

        const updateData = {
          Id: editingPlugin.value?.Id,
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
          FileUrl: fileUrl, // 如果有新文件则更新，否则保持原值
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

/**
 * 处理分页变化
 * @param event - 分页事件对象
 */
const onPageChange = (event: { page: number; rows: number }) => {
  currentPage.value = event.page + 1; // PrimeVue 的 page 是从 0 开始的
  rowsPerPage.value = event.rows;
  loadData();
};

/**
 * 确认删除插件
 * @param plugin - 待删除的插件
 * @param event - 点击事件对象
 */
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

/**
 * 删除插件
 * @param plugin - 待删除的插件
 */
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

/**
 * 处理菜单点击
 * @param menuKey - 菜单键值
 */
const handleMenuClick = (menuKey: MenuKey) => {
  activeMenu.value = menuKey;
  loadData(); // 切换菜单时加载数据
};

// 初始化加载据
onMounted(() => {
  loadData();
});

const router = useRouter();

/** 返回上一页 */
const goBack = () => {
  router.back();
};

/** 获取当前数据列表 */
const getCurrentData = () => {
  switch (activeMenu.value) {
    case MenuKey.MyPlugins:
      return pluginsData.value;
    case MenuKey.UploadHistory:
      return uploadHistory.value;
    default:
      return [];
  }
};

/** 获取编辑按钮的提示文本 */
const getEditTooltip = () => {
  return activeMenu.value === MenuKey.MyPlugins ? "编辑插件" : "";
};

/** 获取删除按钮的提示文本 */
const getDeleteTooltip = () => {
  return activeMenu.value === MenuKey.MyPlugins ? "删除插件" : "";
};

/**
 * 格式化数字
 * @param num - 待格式化的数字
 * @returns 格式化后的字符串
 */
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

// 添加新的ref
const isDraggingScreenshot = ref(false);
const screenshotInput = ref<HTMLInputElement | null>(null);

/**
 * 处理截图选择
 * @param event - 文件选择事件
 */
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

/**
 * 处理截图拖放
 * @param event - 拖放事件
 */
const handleScreenshotDrop = (event: DragEvent) => {
  isDraggingScreenshot.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  processScreenshots(files);
};

/**
 * 处理截图文件
 * @param files - 截图文件数组
 */
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

/**
 * 移除指定截图
 * @param index - 截图索引
 */
const removeScreenshot = (index: number) => {
  pluginForm.value.Screenshots.splice(index, 1);
};

/**
 * 更新窗口X坐标
 * @param val - X坐标值
 */
const updatePositionX = (val: number) => {
  pluginForm.value.Position[0] = val ?? -1;
};

/**
 * 更新窗口Y坐标
 * @param val - Y坐标值
 */
const updatePositionY = (val: number) => {
  pluginForm.value.Position[1] = val ?? -1;
};

/**
 * 处理表格行点击
 * @param event - 包含行数据的事件对象
 */
const onRowClick = (event: { data: Plugin }) => {
  selectedPlugin.value = event.data;
  if (activeMenu.value === MenuKey.UploadHistory) {
    // 上传记录的详情展示
    showDetailDialog.value = true;
  } else {
    // 我的插件的详情展示
    showDetailDialog.value = true;
  }
};
</script>

<style lang="less" scoped>
.plugin-develop {
  display: flex;
  height: 100vh;
  background-color: #fff;
  overflow: hidden;

  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    z-index: 5001;
  }

  .sidebar {
    width: 240px;
    background: #ffffff;
    border-right: 1px solid #e4e4e4;
    height: 100%;
    display: flex;
    flex-direction: column;

    .menu-header {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 1px solid #e4e4e4;
      flex-shrink: 0;

      .back-button {
        padding: 0.3rem;
        margin-right: 0.5rem;

        &:hover {
          background: #f0f7ff;
        }
      }

      span {
        flex: 1;
      }
    }

    .menu-items {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;

      .menu-item {
        display: flex;
        align-items: center;
        padding: 0.875rem 1.5rem;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #666;
        margin: 0.2rem 0.5rem;
        border-radius: 6px;

        i {
          margin-right: 0.75rem;
          font-size: 1.1rem;
        }

        &:hover,
        &.active {
          background: #f0f7ff;
          color: var(--primary-color);
        }

        &.active {
          font-weight: 500;
          border-left: 3px solid var(--primary-color);
        }
      }
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: #ffffff;

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid #e4e4e4;
      flex-shrink: 0;

      h2 {
        margin: 0;
        font-weight: 600;
        color: #2c3e50;
      }
    }

    .content-table {
      flex: 1;
      overflow: auto;
      padding: 0 2rem 2rem;

      :deep(.p-datatable-wrapper) {
        border-radius: 8px;
        border: 1px solid #e4e4e4;
        overflow: hidden;
      }

      :deep(.p-datatable-tbody > tr) {
        cursor: pointer;
      }

      :deep(.p-datatable-tbody > tr:hover) {
        background-color: #f8f9fa;
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

:deep(.p-image-preview-container) {
  .p-image-preview {
    max-width: 90vw;
    max-height: 90vh;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
  }
}

:deep(.p-image-mask) {
  background-color: rgba(0, 0, 0, 0.9);
}

.screenshot-upload {
  .screenshot-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;

    .preview-item {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e4e4e4;
      aspect-ratio: 16/9;

      .image-container {
        width: 100%;
        height: 100%;

        :deep(.p-image) {
          width: 100%;
          height: 100%;
          display: block;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
      }

      .delete-btn {
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s ease;
        scale: 0.8;
        z-index: 1;
      }

      &:hover .delete-btn {
        opacity: 1;
      }
    }

    .upload-button {
      aspect-ratio: 16/9;
      border: 2px dashed #e4e4e4;
      border-radius: 6px;
      background: #f8f9fa;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;

      &.dragging,
      &:hover {
        border-color: var(--primary-color);
        background: #f0f7ff;
      }

      .upload-content {
        text-align: center;
        color: #666;

        i {
          color: var(--primary-color);
          display: block;
        }

        p {
          margin: 0;
          color: #666;
        }

        small {
          display: block;
          margin-top: 2px;
        }
      }
    }
  }
}

:deep(.p-dialog) {
  .p-dialog-header,
  .p-dialog-footer {
    padding: 1.5rem;
    border-bottom: 1px solid #e4e4e4;
  }

  .p-dialog-content {
    padding: 0;
    overflow: auto;
    max-height: calc(90vh - 120px);
  }
}

:deep(.p-image) {
  .p-image-preview-container {
    img {
      display: block;
      max-width: 100%;
      height: auto;
    }
  }

  .p-image-preview {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
  }

  .p-image-mask {
    background-color: rgba(0, 0, 0, 0.9);
  }

  .p-image-toolbar {
    background-color: rgba(0, 0, 0, 0.5);
    padding: 0.5rem;
  }
}

.debug-button {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 100;

  .debug-link {
    &:hover {
      color: var(--primary-color);
      background-color: var(--surface-100);
    }
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;

  &:hover {
    background: #999;
  }
}

.form-container {
  height: 100%;
  overflow: auto;
  padding: 1.5rem;
}

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
            background: #ccc;

            &.p-highlight {
              background: var(--primary-color);
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
  object-fit: cover !important;
}
</style>

<style lang="less">
@import "../../assets/css/variable.less";
</style>
