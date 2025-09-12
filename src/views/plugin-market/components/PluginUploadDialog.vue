<template>
  <Dialog
    :visible="visible"
    :header="isEditMode ? '编辑插件' : '上传插件'"
    :modal="true"
    class="w-[700px] plugin-upload-dialog"
    @update:visible="$emit('update:visible', $event)"
    @hide="$emit('close')">
    <div class="p-6 p-t-0">
      <!-- 基本信息 -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-4">基本信息</h3>
        <div class="space-y-4">
          <!-- 上传区域 -->
          <div
            class="upload-area"
            :class="{ dragging: isDragging }"
            @drop.prevent="$emit('file-drop', $event)"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false">
            <input
              type="file"
              ref="fileInput"
              accept=".zip"
              class="hidden"
              @change="$emit('file-select', $event)" />

            <template v-if="!pluginForm.File">
              <div
                class="text-center cursor-pointer p-8"
                @click="$emit('trigger-file-input')">
                <i class="pi pi-cloud-upload text-4xl text-primary mb-4"></i>
                <p class="text-lg mb-2">
                  {{
                    isEditMode
                      ? "点击或拖拽更新插件代码(可选)"
                      : "点击或拖拽上传插件包"
                  }}
                </p>
                <small v-if="isEditMode" class="warning-text">
                  若不更新插件代码，请勿上传<br />
                </small>
                <small class="hint-text">支持 15MB 以内的 zip 文件</small>
              </div>
            </template>

            <template v-else>
              <div class="flex items-center p-4 bg-white rounded-lg">
                <i class="pi pi-file-zip text-2xl text-primary mr-4"></i>
                <div class="flex-1">
                  <span class="block font-medium">{{
                    pluginForm.File.name
                  }}</span>
                  <span class="text-sm hint-text">{{
                    formatFileSize(pluginForm.File.size)
                  }}</span>
                </div>
                <Button
                  icon="pi pi-times"
                  class="p-button-text"
                  @click="$emit('remove-file')" />
              </div>
            </template>
          </div>

          <!-- 图标和名称并排 -->
          <div class="grid grid-cols-[120px_1fr] gap-4">
            <!-- 插件图标 -->
            <div>
              <label class="block mb-2">插件图标</label>
              <div class="icon-upload-area">
                <img
                  v-if="pluginForm.Icon"
                  :src="pluginForm.Icon"
                  class="w-full h-full object-cover" />
                <i v-else class="pi pi-image text-3xl icon-placeholder"></i>
                <input
                  type="file"
                  ref="iconInput"
                  accept="image/*"
                  class="hidden"
                  @change="$emit('icon-select', $event)" />
                <div
                  class="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    icon="pi pi-upload"
                    class="p-button-rounded p-button-text p-button-white"
                    @click="$emit('trigger-icon-input')" />
                </div>
              </div>
            </div>

            <!-- 名称和版本 -->
            <div class="space-y-4">
              <div>
                <label class="block mb-2">
                  插件名称 <span class="required-mark">*</span>
                </label>
                <InputText
                  :model-value="pluginForm.Name"
                  class="w-full"
                  :class="{ 'p-invalid': errors.Name }"
                  placeholder="请输入插件名称"
                  @update:model-value="
                    $emit('update:form', { field: 'Name', value: $event })
                  " />
                <small class="required-mark" v-if="errors.Name">{{
                  errors.Name
                }}</small>
              </div>
              <div>
                <label class="block mb-2">
                  版本号 <span class="required-mark">*</span>
                </label>
                <InputText
                  :model-value="pluginForm.Version"
                  class="w-full"
                  :class="{ 'p-invalid': errors.Version }"
                  placeholder="输入版本号: 1.0.0"
                  @update:model-value="
                    $emit('update:form', { field: 'Version', value: $event })
                  " />
                <small class="required-mark" v-if="errors.Version">{{
                  errors.Version
                }}</small>
              </div>
              <div>
                <label class="block mb-2">
                  插件分类 <span class="required-mark">*</span>
                </label>
                <Dropdown
                  :model-value="pluginForm.Category"
                  :options="categoryOptions"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                  placeholder="选择插件分类"
                  @update:model-value="
                    $emit('update:form', { field: 'Category', value: $event })
                  " />
              </div>
            </div>
          </div>

          <!-- 描述和标签 -->
          <div>
            <label class="block mb-2">
              插件描述 <span class="required-mark">*</span>
            </label>
            <Textarea
              :model-value="pluginForm.Description"
              class="w-full"
              :class="{ 'p-invalid': errors.Description }"
              rows="3"
              placeholder="请输入插件描述"
              @update:model-value="
                $emit('update:form', { field: 'Description', value: $event })
              " />
            <small class="required-mark" v-if="errors.Description">{{
              errors.Description
            }}</small>
          </div>

          <div>
            <label class="block mb-2">标签</label>
            <InputChips
              :model-value="pluginForm.Tags"
              class="w-full"
              placeholder="输入标签后按回车"
              :max="5"
              :allowDuplicate="false"
              @update:model-value="
                $emit('update:form', { field: 'Tags', value: $event })
              " />
            <small class="hint-text">最多添加5个标签</small>
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
              <label class="block mb-2">
                窗口ID <span class="required-mark">*</span>
              </label>
              <InputText
                :model-value="pluginForm.WindowId"
                class="w-full"
                :class="{ 'p-invalid': errors.WindowId }"
                placeholder="请输入窗口ID"
                :disabled="isEditMode"
                @update:model-value="
                  $emit('update:form', { field: 'WindowId', value: $event })
                " />
              <small class="required-mark" v-if="errors.WindowId">{{
                errors.WindowId
              }}</small>
            </div>
            <div>
              <label class="block mb-2">
                窗口标题 <span class="required-mark">*</span>
              </label>
              <InputText
                :model-value="pluginForm.Title"
                class="w-full"
                :class="{ 'p-invalid': errors.Title }"
                placeholder="请输入窗口标题"
                @update:model-value="
                  $emit('update:form', { field: 'Title', value: $event })
                " />
              <small class="required-mark" v-if="errors.Title">{{
                errors.Title
              }}</small>
            </div>
          </div>

          <!-- 窗口大小 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block mb-2">
                窗口宽度 <span class="required-mark">*</span>
              </label>
              <InputNumber
                :model-value="pluginForm.Size[0]"
                class="w-full"
                :min="200"
                :max="2000"
                placeholder="窗口宽度(px)"
                @update:model-value="
                  $emit('update:form', {
                    field: 'Size',
                    value: [$event, pluginForm.Size[1]],
                  })
                " />
            </div>
            <div>
              <label class="block mb-2">
                窗口高度 <span class="required-mark">*</span>
              </label>
              <InputNumber
                :model-value="pluginForm.Size[1]"
                class="w-full"
                :min="200"
                :max="2000"
                placeholder="窗口高度(px)"
                @update:model-value="
                  $emit('update:form', {
                    field: 'Size',
                    value: [pluginForm.Size[0], $event],
                  })
                " />
            </div>
          </div>

          <!-- 窗口位置 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block mb-2">
                窗口位置X <span class="required-mark">*</span>
                <i
                  class="pi pi-question-circle ml-1 question-icon cursor-help"
                  v-tooltip.top="'默认值 -1 表示窗口水平居中'" />
              </label>
              <InputNumber
                :model-value="pluginForm.Position?.[0] ?? -1"
                class="w-full"
                placeholder="水平位置(逻辑像素)"
                @update:model-value="
                  $emit('update:form', {
                    field: 'Position',
                    value: [$event ?? -1, pluginForm.Position?.[1] ?? -1],
                  })
                " />
              <small class="required-mark" v-if="errors.Position">{{
                errors.Position
              }}</small>
            </div>
            <div>
              <label class="block mb-2">
                窗口位置Y <span class="required-mark">*</span>
                <i
                  class="pi pi-question-circle ml-1 question-icon cursor-help"
                  v-tooltip.top="'默认值 -1 表示窗口垂直居中'" />
              </label>
              <InputNumber
                :model-value="pluginForm.Position?.[1] ?? -1"
                class="w-full"
                placeholder="垂直位置(逻辑像素)"
                @update:model-value="
                  $emit('update:form', {
                    field: 'Position',
                    value: [pluginForm.Position?.[0] ?? -1, $event ?? -1],
                  })
                " />
            </div>
          </div>

          <!-- 窗口属性 -->
          <div class="flex gap-6">
            <div class="flex items-center">
              <Checkbox
                :model-value="pluginForm.AlwaysOnTop"
                :binary="true"
                @update:model-value="
                  $emit('update:form', { field: 'AlwaysOnTop', value: $event })
                " />
              <label class="ml-2">窗口置顶</label>
            </div>
            <div class="flex items-center">
              <Checkbox
                :model-value="pluginForm.Resizable"
                :binary="true"
                @update:model-value="
                  $emit('update:form', { field: 'Resizable', value: $event })
                " />
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
                @click="$emit('remove-screenshot', index)" />
            </div>

            <!-- 上传按钮 -->
            <div
              v-if="pluginForm.Screenshots.length < 5"
              class="upload-button"
              @drop.prevent="$emit('screenshot-drop', $event)"
              @dragover.prevent="isDraggingScreenshot = true"
              @dragleave.prevent="isDraggingScreenshot = false"
              :class="{ dragging: isDraggingScreenshot }"
              @click="$emit('trigger-screenshot-input')">
              <input
                type="file"
                ref="screenshotInput"
                accept="image/*"
                multiple
                class="hidden"
                @change="$emit('screenshot-select', $event)" />
              <div class="upload-content">
                <i class="pi pi-plus text-xl mb-1"></i>
                <p class="text-sm">上传截图</p>
                <small class="text-xs hint-text">最多5张</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-4">
        <Button label="取消" class="p-button-text" @click="$emit('close')" />
        <Button
          :label="isEditMode ? '保存' : '上传'"
          :icon="isEditMode ? 'pi pi-save' : 'pi pi-upload'"
          @click="$emit('submit')" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import InputNumber from "primevue/inputnumber";
import Checkbox from "primevue/checkbox";
import InputChips from "primevue/inputchips";
import Dropdown from "primevue/dropdown";
import Image from "primevue/image";
import type {
  PluginFormData,
  PluginFormErrors,
  CategoryOption,
} from "@/interface/pluginMarket.d";
import { formatFileSize } from "@/utils/pluginUtils";

interface Props {
  visible: boolean;
  isEditMode: boolean;
  pluginForm: PluginFormData;
  errors: PluginFormErrors;
  categoryOptions: CategoryOption[];
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "close"): void;
  (e: "submit"): void;
  (e: "file-drop", event: DragEvent): void;
  (e: "file-select", event: Event): void;
  (e: "icon-select", event: Event): void;
  (e: "screenshot-select", event: Event): void;
  (e: "screenshot-drop", event: DragEvent): void;
  (e: "trigger-file-input"): void;
  (e: "trigger-icon-input"): void;
  (e: "trigger-screenshot-input"): void;
  (e: "remove-file"): void;
  (e: "remove-screenshot", index: number): void;
  (e: "update:form", data: { field: string; value: any }): void;
}

defineProps<Props>();
defineEmits<Emits>();

// 拖拽状态
const isDragging = ref(false);
const isDraggingScreenshot = ref(false);
</script>

<style lang="less">
.plugin-upload-dialog {
  .upload-area {
    border: 2px dashed var(--theme-border);
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    background: var(--theme-background-secondary);
    transition: all 0.3s ease;

    &.dragging {
      border-color: var(--theme-primary);
      background: rgba(
        var(--theme-primary-rgb),
        var(--theme-transparency-border)
      );
    }
  }

  .icon-upload-area {
    position: relative;
    width: 6rem;
    height: 6rem;
    border-radius: 8px;
    overflow: hidden;
    border: 2px dashed var(--theme-border);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--theme-background-secondary);

    .icon-placeholder {
      color: var(--theme-text-muted);
    }
  }

  .warning-text {
    color: var(--theme-warning);
  }

  .hint-text {
    color: var(--theme-text-muted);
  }

  .required-mark {
    color: var(--theme-danger);
  }

  .error-text {
    color: var(--theme-danger);
  }

  .question-icon {
    color: var(--theme-text-muted);
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
        border: 1px solid var(--theme-border);
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
        border: 2px dashed var(--theme-border);
        border-radius: 6px;
        background: var(--theme-background-secondary);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        &.dragging,
        &:hover {
          border-color: var(--theme-primary);
          background: rgba(var(--theme-primary-rgb), 0.1);
        }

        .upload-content {
          text-align: center;
          color: var(--theme-text-muted);

          i {
            color: var(--theme-primary);
            display: block;
          }

          p {
            margin: 0;
            color: var(--theme-text-muted);
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
      border-bottom: 1px solid var(--theme-border);
    }

    .p-dialog-content {
      padding: 0;
      overflow: auto;
      max-height: calc(90vh - 120px);
    }
  }
}
</style>
