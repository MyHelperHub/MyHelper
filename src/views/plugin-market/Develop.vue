<template>
  <div class="plugin-develop">
    <i class="pi pi-times close close-button" @click="handleClose"></i>
    <!-- 左侧边栏 -->
    <div class="sidebar">
      <div class="menu-header">
        <Button
          icon="pi pi-arrow-left"
          class="p-button-text p-button-sm back-button"
          @click="goBack" />
        <span>插件管理</span>
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
            ipcCreateNewWindow(WINDOW_CONFIG[NewWindowEnum.MhPlugin]).then(
              (res) => {
                if (res === 0) {
                  toast.add({
                    severity: 'error',
                    summary: '错误',
                    detail: '该窗口已存在',
                    life: 3000,
                  });
                }
              },
            );
          }
        "
        class="debug-link" />
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="content-header">
        <h2>{{ menuTitles[activeMenu] }}</h2>
        <Button
          v-if="activeMenu === 'my-plugins'"
          label="上传插件"
          icon="pi pi-upload"
          @click="showPluginDialog = true" />
      </div>

      <DataTable
        :value="getCurrentData()"
        selectionMode="single"
        :loading="loading"
        class="content-table"
        @rowClick="onRowClick">
        <Column field="name" header="插件名称">
          <template #body="{ data }">
            <div class="plugin-name">
              <span>{{ data.name }}</span>
              <Tag
                v-if="data.status"
                :value="data.status"
                :severity="getStatusSeverity(data.status)" />
            </div>
          </template>
        </Column>
        <Column field="version" header="版本" style="width: 100px" />
        <Column
          v-if="activeMenu === 'my-plugins'"
          field="downloads"
          header="下载次数"
          style="width: 100px" />
        <Column
          v-if="activeMenu === 'upload-history'"
          field="uploadTime"
          header="上传时间"
          style="width: 150px">
          <template #body="{ data }">
            {{ formatDate(data.uploadTime) }}
          </template>
        </Column>
        <Column
          v-else
          field="updateTime"
          header="更新时间"
          style="width: 150px">
          <template #body="{ data }">
            {{ formatDate(data.updateTime) }}
          </template>
        </Column>
        <Column
          v-if="activeMenu === 'upload-history'"
          field="message"
          header="备注" />
        <Column
          v-if="activeMenu === 'my-plugins'"
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
            <!-- 上传区域 - 仅在上传时显示 -->
            <div
              v-if="!isEditMode"
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

              <template v-if="!pluginForm.file">
                <div
                  class="text-center cursor-pointer p-8"
                  @click="triggerFileInput">
                  <i class="pi pi-cloud-upload text-4xl text-primary mb-4"></i>
                  <p class="text-lg mb-2">点击或拖拽上传插件包</p>
                  <small class="text-gray-500">支持 10MB 以内的 zip 文件</small>
                </div>
              </template>

              <template v-else>
                <div class="flex items-center p-4 bg-white rounded-lg">
                  <i class="pi pi-file-zip text-2xl text-primary mr-4"></i>
                  <div class="flex-1">
                    <span class="block font-medium">{{
                      pluginForm.file.name
                    }}</span>
                    <span class="text-sm text-gray-500">{{
                      formatFileSize(pluginForm.file.size)
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
                    v-if="pluginForm.icon"
                    :src="pluginForm.icon"
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
                    v-model="pluginForm.name"
                    class="w-full"
                    :class="{ 'p-invalid': errors.name }"
                    placeholder="请输入插件名称" />
                  <small class="text-red-500" v-if="errors.name">{{
                    errors.name
                  }}</small>
                </div>
                <div>
                  <label class="block mb-2"
                    >版本号 <span class="text-red-500">*</span></label
                  >
                  <InputText
                    v-model="pluginForm.version"
                    class="w-full"
                    :class="{ 'p-invalid': errors.version }"
                    placeholder="输入版本号: 1.0.0" />
                  <small class="text-red-500" v-if="errors.version">{{
                    errors.version
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
                v-model="pluginForm.description"
                class="w-full"
                :class="{ 'p-invalid': errors.description }"
                rows="3"
                placeholder="请输入插件描述" />
              <small class="text-red-500" v-if="errors.description">{{
                errors.description
              }}</small>
            </div>

            <div>
              <label class="block mb-2">标签</label>
              <InputChips
                v-model="pluginForm.tags"
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
                  v-model="pluginForm.windowId"
                  class="w-full"
                  :class="{ 'p-invalid': errors.windowId }"
                  placeholder="请输入窗口ID" />
                <small class="text-red-500" v-if="errors.windowId">{{
                  errors.windowId
                }}</small>
              </div>
              <div>
                <label class="block mb-2"
                  >窗口标题 <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="pluginForm.title"
                  class="w-full"
                  :class="{ 'p-invalid': errors.title }"
                  placeholder="请输入窗口标题" />
                <small class="text-red-500" v-if="errors.title">{{
                  errors.title
                }}</small>
              </div>
            </div>

            <!-- 窗大小 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-2"
                  >窗口宽度 <span class="text-red-500">*</span></label
                >
                <InputNumber
                  v-model="pluginForm.size[0]"
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
                  v-model="pluginForm.size[1]"
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
                  :modelValue="pluginForm.position?.[0] ?? -1"
                  @update:modelValue="(val) => updatePositionX(val)"
                  class="w-full"
                  placeholder="水平位置(逻辑像素)" />
                <small class="text-red-500" v-if="errors.position">{{
                  errors.position
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
                  :modelValue="pluginForm.position?.[1] ?? -1"
                  @update:modelValue="(val) => updatePositionY(val)"
                  class="w-full"
                  placeholder="垂直位置(逻辑像素)" />
              </div>
            </div>

            <!-- 窗口属性 -->
            <div class="flex gap-6">
              <div class="flex items-center">
                <Checkbox v-model="pluginForm.alwaysOnTop" :binary="true" />
                <label class="ml-2">窗口置顶</label>
              </div>
              <div class="flex items-center">
                <Checkbox v-model="pluginForm.resizable" :binary="true" />
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
                v-for="(screenshot, index) in pluginForm.screenshots"
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
                v-if="pluginForm.screenshots.length < 5"
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
          <Button
            label="取消"
            class="p-button-text"
            @click="closeDialog"
            :disabled="uploading" />
          <Button
            :label="isEditMode ? '保存' : '上传'"
            :icon="isEditMode ? 'pi pi-save' : 'pi pi-upload'"
            @click="isEditMode ? updatePlugin() : submitPlugin()"
            :loading="uploading" />
        </div>
      </template>
    </Dialog>

    <!-- 详情对话框 -->
    <Dialog
      v-model:visible="showDetailDialog"
      header="插件详情"
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
                :src="selectedPlugin.icon || 'https://placeholder.co/48'"
                width="48"
                height="48" />
              <div>
                <h3 class="text-xl font-semibold">{{ selectedPlugin.name }}</h3>
                <p class="text-sm text-gray-600">{{ selectedPlugin.author }}</p>
              </div>
            </div>
            <Tag
              v-if="selectedPlugin.status"
              :value="selectedPlugin.status"
              :severity="getStatusSeverity(selectedPlugin.status)" />
          </div>

          <!-- 插件统计信息 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-600">版本</label>
              <p class="mt-1">{{ selectedPlugin.version }}</p>
            </div>
            <div v-if="selectedPlugin.downloads !== undefined">
              <label class="text-sm text-gray-600">下载次数</label>
              <p class="mt-1">{{ formatNumber(selectedPlugin.downloads) }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-600">创建时间</label>
              <p class="mt-1">{{ formatDate(selectedPlugin.createdTime) }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-600">更新时间</label>
              <p class="mt-1">{{ formatDate(selectedPlugin.updateTime) }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-600">评分</label>
              <div class="mt-1 flex items-center gap-2">
                <Rating
                  :modelValue="selectedPlugin.rating || 0"
                  :cancel="false"
                  readonly />
                <span class="text-sm text-gray-600">{{
                  selectedPlugin.rating || "暂评分"
                }}</span>
              </div>
            </div>
          </div>

          <!-- 插件标签 -->
          <div v-if="selectedPlugin.tags?.length">
            <label class="text-sm text-gray-600">标签</label>
            <div class="mt-2 flex flex-wrap gap-2">
              <Tag
                v-for="tag in selectedPlugin.tags"
                :key="tag"
                :value="tag"
                severity="info" />
            </div>
          </div>

          <!-- 插件描述 -->
          <div v-if="selectedPlugin.description">
            <label class="text-sm text-gray-600">描述</label>
            <p class="mt-1 text-gray-700 whitespace-pre-line">
              {{ selectedPlugin.description }}
            </p>
          </div>

          <!-- 备注信息 -->
          <div v-if="selectedPlugin.message">
            <label class="text-sm text-gray-600">备注</label>
            <p class="mt-1 text-gray-700">{{ selectedPlugin.message }}</p>
          </div>

          <!-- 图预览 -->
          <div v-if="selectedPlugin.screenshots?.length">
            <label class="text-sm text-gray-600">截图预览</label>
            <div class="mt-2">
              <Carousel
                :value="selectedPlugin.screenshots"
                :numVisible="1"
                :numScroll="1"
                :circular="true"
                :showIndicators="true"
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
          </div>
        </div>
      </div>
    </Dialog>

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
import { ipcCloseWindow } from "@/api/ipc/window.api";
import { NewWindowEnum, WINDOW_CONFIG } from "@/interface/windowEnum";
import { ipcCreateNewWindow } from "@/api/ipc/window.api";
import { isDev } from "@/utils/common";

const toast = useToast();
const confirm = useConfirm();
type MenuKey = "my-plugins" | "upload-history";
const activeMenu = ref<MenuKey>("my-plugins");
const showPluginDialog = ref(false);
const showDetailDialog = ref(false);
const loading = ref(false);
const uploading = ref(false);
const isDragging = ref(false);

// 菜单配置
const MENU_ITEMS = [
  { key: "my-plugins", label: "我的插件", icon: "pi pi-list" },
  { key: "upload-history", label: "上传记录", icon: "pi pi-history" },
] as const;

const menuTitles = {
  "my-plugins": "我的插件",
  "upload-history": "上传记录",
};

const menuItems = ref(MENU_ITEMS);

// 修改 Plugin 接口
type PluginStatus = "已发布" | "审核中" | "已驳回" | "成功" | "失败" | "处理中";

interface Plugin {
  id: number;
  name: string;
  description: string;
  version: string;
  status?: PluginStatus;
  downloads?: number;
  createdTime: string;
  updateTime: string;
  author: string;
  icon?: string;
  tags?: string[];
  rating?: number;
  screenshots?: string[];
  windowId?: string;
  title?: string;
  size?: [number, number];
  position?: [number, number];
  alwaysOnTop?: boolean;
  resizable?: boolean;
  message?: string;
}

// 修改模拟数据
const plugins = ref<Plugin[]>([
  {
    id: 1,
    name: "代码格式化工具",
    description: "一个强大的代码格式化工具，支持多种编程语言。",
    version: "1.0.0",
    status: "已发布",
    downloads: 12580,
    createdTime: "2024-02-20",
    updateTime: "2024-03-20",
    author: "JohnDoe",
    rating: 4.5,
  },
  {
    id: 2,
    name: "截图工具Pro",
    description: "专业的屏幕截图工具，支持区域截图、滚动截图。",
    version: "1.1.0",
    status: "审核中",
    downloads: 4567,
    createdTime: "2024-02-15",
    updateTime: "2024-03-15",
    author: "Jane Smith",
    rating: 4.2,
  },
  {
    id: 3,
    name: "网络测大师",
    description: "准确测试网络速度，支持多节测速。",
    version: "1.0.0",
    status: "已驳回",
    downloads: 3456,
    createdTime: "2024-02-10",
    updateTime: "2024-03-10",
    author: "NetMaster",
    rating: 3.8,
  },
]);

const uploadHistory = ref([
  {
    id: 1,
    name: "代码格式化工具",
    version: "1.0.0",
    uploadTime: "2024-03-20 14:30:00",
    status: "成功",
    message: "上传成功",
  },
  {
    id: 2,
    name: "代码格式化工具",
    version: "0.9.0",
    uploadTime: "2024-03-19 10:20:00",
    status: "失败",
    message: "验证未通过",
  },
  {
    id: 3,
    name: "截图工具Pro",
    version: "1.1.0",
    uploadTime: "2024-03-15 16:45:00",
    status: "处理中",
    message: "正在处理",
  },
]);

// 表单状态
const pluginForm = ref({
  name: "",
  description: "",
  version: "",
  tags: [] as string[],
  file: null as File | null,
  icon: "" as string,
  screenshots: [] as string[],
  windowId: "",
  title: "",
  size: [800, 600] as [number, number],
  uuid: "",
  position: [-1, -1] as [number, number],
  alwaysOnTop: false,
  resizable: true,
});

const selectedPlugin = ref<Plugin | null>(null);
const editingPlugin = ref<Plugin | null>(null);

// 简化为一个对象管理所有错误信息
const errors = ref({
  name: "",
  version: "",
  description: "",
  windowId: "",
  title: "",
  size: "",
  position: "",
});

// 移除 showEditDialog，使用 editingPlugin 判断是否为编辑模式
const isEditMode = computed(() => !!editingPlugin.value);

// 更新模板的判断
// 将 showEditDialog 替换为 isEditMode
// 例如: :header="isEditMode ? '编辑插件' : '上传插件'"

// 简化关闭对话框逻辑
const closeDialog = () => {
  showPluginDialog.value = false;
  editingPlugin.value = null;
  resetForm();
};

// 表单重置逻辑独立
const resetForm = () => {
  pluginForm.value = {
    name: "",
    description: "",
    version: "",
    tags: [],
    file: null,
    icon: "",
    screenshots: [],
    windowId: "",
    title: "",
    size: [800, 600],
    position: [-1, -1],
    alwaysOnTop: false,
    resizable: true,
    uuid: "",
  };
  errors.value = {
    name: "",
    version: "",
    description: "",
    windowId: "",
    title: "",
    size: "",
    position: "",
  };
};

// 简化编辑插件逻辑
const editPlugin = (plugin: Plugin) => {
  editingPlugin.value = plugin;
  showPluginDialog.value = true;
  Object.assign(pluginForm.value, {
    ...plugin,
    file: null,
    tags: plugin.tags || [],
    screenshots: plugin.screenshots || [],
    size: plugin.size || [800, 600],
    position: plugin.position || [-1, -1],
    alwaysOnTop: plugin.alwaysOnTop ?? false,
    resizable: plugin.resizable ?? true,
  });
};

// 添加图标相关的引用
const iconInput = ref<HTMLInputElement | null>(null);

// 添加图标处理函数
const handleIconSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      pluginForm.value.icon = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const triggerIconInput = () => {
  iconInput.value?.click();
};

// 验证表单
const validateForm = () => {
  errors.value = {
    name: "",
    version: "",
    description: "",
    windowId: "",
    title: "",
    size: "",
    position: "",
  };

  let isValid = true;

  // 名称验证
  if (!pluginForm.value.name) {
    errors.value.name = "请输入插件名称";
    isValid = false;
  }

  // 版本验证
  if (!pluginForm.value.version) {
    errors.value.version = "请输入版本号";
    isValid = false;
  } else if (!/^\d+\.\d+\.\d+$/.test(pluginForm.value.version)) {
    errors.value.version = "版本号格式不正确";
    isValid = false;
  }

  if (!pluginForm.value.description) {
    errors.value.description = "请输入插件描述";
    isValid = false;
  }

  if (!pluginForm.value.windowId) {
    errors.value.windowId = "请输入窗口ID";
    isValid = false;
  } else if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(pluginForm.value.windowId)) {
    errors.value.windowId =
      "窗口ID必须以字母开头，只能包含字母、数字、下划线和横线";
    isValid = false;
  }

  if (!pluginForm.value.title) {
    errors.value.title = "请输入窗口标题";
    isValid = false;
  }

  if (!pluginForm.value.size[0] || !pluginForm.value.size[1]) {
    errors.value.size = "请设置窗大小";
    isValid = false;
  }

  if (
    !pluginForm.value.position ||
    pluginForm.value.position[0] === undefined ||
    pluginForm.value.position[1] === undefined
  ) {
    errors.value.position = "请设置窗口位置";
    isValid = false;
  }

  return isValid;
};

// 文件处理函数
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    handleFile(input.files[0]);
  }
};
/** 关闭插件市场窗口 */
const handleClose = () => {
  ipcCloseWindow(NewWindowEnum.PluginMarket);
};
const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files?.length) {
    handleFile(files[0]);
  }
};

const handleFile = (file: File) => {
  if (!file.name.endsWith(".zip")) {
    toast.add({
      severity: "error",
      summary: "格式错误",
      detail: "上传 .zip 格式的文件",
      life: 3000,
    });
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.add({
      severity: "error",
      summary: "文件过大",
      detail: "文件大小不能超过10MB",
      life: 3000,
    });
    return;
  }
  pluginForm.value.file = file;
};

const removeFile = () => {
  pluginForm.value.file = null;
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 添加 ref 定义
const fileInput = ref<HTMLInputElement | null>(null);

// 实现点击触发文件选择的方法
const triggerFileInput = () => {
  fileInput.value?.click();
};

// 提交表单
const submitPlugin = async () => {
  if (!validateForm()) {
    return;
  }

  if (!pluginForm.value.file) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "请选择插件文件",
      life: 3000,
    });
    return;
  }

  uploading.value = true;
  try {
    // 模拟上传
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 模拟成功响应
    const mockResponse = {
      id: Date.now(),
      status: "审核中",
      createdTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      author: "我",
      downloads: 0,
    };

    // 添加到插件列表
    plugins.value.unshift({
      ...mockResponse,
      name: pluginForm.value.name,
      description: pluginForm.value.description,
      version: pluginForm.value.version,
      status: "审核中" as PluginStatus,
      tags: pluginForm.value.tags,
      icon: pluginForm.value.icon,
      screenshots: pluginForm.value.screenshots,
      windowId: pluginForm.value.windowId,
      title: pluginForm.value.title,
      size: pluginForm.value.size,
      position: pluginForm.value.position,
      alwaysOnTop: pluginForm.value.alwaysOnTop,
      resizable: pluginForm.value.resizable,
    });

    // 添加到上传历史
    uploadHistory.value.unshift({
      id: mockResponse.id,
      name: pluginForm.value.name,
      version: pluginForm.value.version,
      uploadTime: new Date().toISOString(),
      status: "处理中",
      message: "正在处理上传请求",
    });

    toast.add({
      severity: "success",
      summary: "成功",
      detail: "插件上传成功",
      life: 3000,
    });
    closeDialog();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "插件上传失败",
      life: 3000,
    });
  } finally {
    uploading.value = false;
  }
};

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const getStatusSeverity = (status: string) => {
  const map: Record<string, string> = {
    已发布: "success",
    审核中: "warning",
    已驳回: "danger",
    成功: "success",
    失败: "danger",
    处理中: "warning",
  };
  return map[status] || "info";
};

// 数据加载函数
const loadData = () => {
  loading.value = true;
  try {
    // 直接使用模拟数据,不发送请求
    switch (activeMenu.value) {
      case "my-plugins":
        // 使用已有的模拟数据
        break;
      case "upload-history":
        // 使用已有的模拟据
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
    loading.value = false;
  }
};

const confirmDelete = (plugin: any, event: { currentTarget: any }) => {
  confirm.require({
    target: event.currentTarget,
    message: `确定要删除插件 "${plugin.name}" 吗？`,
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
      deletePlugin(plugin);
    },
    reject: () => {
      return;
    },
  });
};

const deletePlugin = async (plugin: any) => {
  try {
    // 模拟删除延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 数组中移除
    const index = plugins.value.findIndex((p) => p.id === plugin.id);
    if (index > -1) {
      plugins.value.splice(index, 1);
    }

    toast.add({
      severity: "success",
      summary: "成功",
      detail: "插件已删除",

      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "删除插件失败",
      life: 3000,
    });
  }
};

const handleMenuClick = (menuKey: MenuKey) => {
  activeMenu.value = menuKey;
  loadData(); // 切换菜单时加载数据
};

// 初始化加载据
onMounted(() => {
  loadData();
});

const router = useRouter();

const goBack = () => {
  router.back();
};

// 获取当前应该显示的数据
const getCurrentData = () => {
  switch (activeMenu.value) {
    case "my-plugins":
      return plugins.value;
    case "upload-history":
      return uploadHistory.value;
    default:
      return [];
  }
};

// 获取编辑按钮的提示信息
const getEditTooltip = () => {
  return activeMenu.value === "my-plugins" ? "编辑插件" : "";
};

// 获取删除按钮的提示信息
const getDeleteTooltip = () => {
  return activeMenu.value === "my-plugins" ? "删除插件" : "";
};

// 添加数字格式化函数
const formatNumber = (num: number) => {
  return new Intl.NumberFormat().format(num);
};

// 添加新的ref
const isDraggingScreenshot = ref(false);
const screenshotInput = ref<HTMLInputElement | null>(null);

// 修改截图处理相关的方法
const handleScreenshotSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const files = Array.from(input.files)
    .filter((file) => file.type.startsWith("image/"))
    .filter((file) => {
      const isValidSize = file.size <= 5 * 1024 * 1024;
      if (!isValidSize) {
        toast.add({
          severity: "error",
          summary: "文件过大",
          detail: `文件 ${file.name} 超过5MB`,
          life: 3000,
        });
      }
      return isValidSize;
    })
    .slice(0, 5 - pluginForm.value.screenshots.length);

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        pluginForm.value.screenshots.push(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  });
};

const handleScreenshotDrop = (event: DragEvent) => {
  isDraggingScreenshot.value = false;
  const files = Array.from(event.dataTransfer?.files || []);
  processScreenshots(files);
};

const processScreenshots = (files: File[]) => {
  // 过滤出图片文件
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  // 检查文件大小
  const validFiles = imageFiles.filter((file) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        severity: "error",
        summary: "文件过大",
        detail: `文件 ${file.name} 超过5MB`,
        life: 3000,
      });
      return false;
    }
    return true;
  });

  // 检查总数限制
  const remainingSlots = 5 - pluginForm.value.screenshots.length;
  if (validFiles.length > remainingSlots) {
    toast.add({
      severity: "warn",
      summary: "超出限制",
      detail: `最多只能上传5张截图`,
      life: 3000,
    });
    validFiles.splice(remainingSlots);
  }

  // 处理有效文件
  validFiles.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        pluginForm.value.screenshots.push(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  });
};

const triggerScreenshotInput = () => {
  screenshotInput.value?.click();
};

const removeScreenshot = (index: number) => {
  pluginForm.value.screenshots.splice(index, 1);
};

// 添加位置更新处理函数
const updatePositionX = (val: number) => {
  pluginForm.value.position[0] = val ?? -1;
};

const updatePositionY = (val: number) => {
  pluginForm.value.position[1] = val ?? -1;
};

const onRowClick = (event: { data: Plugin | UploadRecord }) => {
  // 根据当前菜单判断数据类型
  if (activeMenu.value === "upload-history") {
    // 上传记录的详情展示
    const record = event.data as UploadRecord;
    selectedPlugin.value = {
      id: record.id,
      name: record.name,
      version: record.version,
      status: record.status as PluginStatus,
      updateTime: record.uploadTime,
      createdTime: record.uploadTime,
      message: record.message,
      author: "我",
      description: "",
    };
  } else {
    // 我的插件的详情展示
    selectedPlugin.value = event.data as Plugin;
  }
  showDetailDialog.value = true;
};

// 添加上传记录的接口定义
interface UploadRecord {
  id: number;
  name: string;
  version: string;
  uploadTime: string;
  status: string;
  message: string;
}

// 修改详情对话框的条件渲染

// 添加更新插件方法
const updatePlugin = async () => {
  if (!validateForm()) {
    return;
  }
  console.log(pluginForm.value);

  uploading.value = true;
  try {
    // 模拟更新操作
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 更新本地数据
    if (editingPlugin.value) {
      const index = plugins.value.findIndex(
        (p) => p.id === editingPlugin.value?.id,
      );
      if (index > -1) {
        plugins.value[index] = { ...editingPlugin.value, ...pluginForm.value };
      }
    }

    toast.add({
      severity: "success",
      summary: "成功",
      detail: "插件更新成功",
      life: 3000,
    });
    closeDialog();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "错误",
      detail: "插件更新失败",
      life: 3000,
    });
  } finally {
    uploading.value = false;
  }
};
</script>

<style lang="less" scoped>
.plugin-develop {
  display: flex;
  min-height: 100vh;
  background-color: #fff;

  .close-button {
    position: absolute;
    top: 5px;
    right: 12px;
    cursor: pointer;
    z-index: 1;
  }

  .sidebar {
    width: 240px;
    background: #ffffff;
    border-right: 1px solid #e4e4e4;
    padding: 1rem 0;

    .menu-header {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 1px solid #e4e4e4;
      margin-bottom: 0.5rem;

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

        &:hover {
          background: #f0f7ff;
          color: var(--primary-color);
        }

        &.active {
          background: #f0f7ff;
          color: var(--primary-color);
          font-weight: 500;
          border-left: 3px solid var(--primary-color);
        }
      }
    }
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    background: #ffffff;

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h2 {
        margin: 0;
        font-weight: 600;
        color: #2c3e50;
      }
    }

    .content-table {
      border: 1px solid #e4e4e4;
      border-radius: 8px;
      overflow: hidden;

      :deep(.p-datatable-tbody > tr) {
        cursor: pointer;
      }
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
    grid-template-columns: repeat(3, 180px);
    gap: 1.5rem;

    .preview-item {
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #e4e4e4;
      height: 101px;

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
      width: 180px;
      height: 101px;
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

// 优化图片预览弹窗样式
:deep(.p-image) {
  .p-image-preview-container {
    img {
      display: block;
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
</style>

<style lang="less">
@import "../../assets/css/variable.less";
</style>
