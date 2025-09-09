<template>
  <Dialog
    v-model:visible="isVisible"
    header="导入 Live2D 模型"
    :style="{ width: '480px' }"
    modal
    :closable="!isImporting"
    @hide="handleDialogHide">
    <div class="import-container">
      <!-- File Selection Section -->
      <div class="section">
        <div class="section-header">
          <h4>选择模型文件</h4>
          <p class="section-description">
            支持 Live2D Cubism 2.1、3.x、4.x 版本模型文件
            (.zip、.model.json、.model3.json、.model4.json)
          </p>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept=".zip,.model.json,.model3.json,.model4.json"
          @change="handleFileSelect"
          class="hidden" />

        <div
          class="file-drop-zone"
          :class="fileDropClasses"
          @click="triggerFileSelect"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @drop.prevent="handleFileDrop">
          <div v-if="!selectedFile" class="drop-placeholder">
            <i class="pi pi-cloud-upload text-4xl mb-3 text-surface-400"></i>
            <p class="text-base font-medium mb-2">
              点击选择文件或拖拽文件到此区域
            </p>
            <span class="text-xs text-surface-500">
              支持 .zip, .model.json, .model3.json, .model4.json
            </span>
          </div>

          <div v-else class="selected-file-info">
            <i class="pi pi-file text-3xl text-primary"></i>
            <div class="file-details">
              <p class="file-name">{{ selectedFile.name }}</p>
              <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
              <p v-if="selectedFile.version" class="file-version">
                {{ selectedFile.version }} 版本
              </p>
            </div>
            <Button
              icon="pi pi-times"
              size="small"
              text
              rounded
              severity="secondary"
              @click.stop="clearSelectedFile" />
          </div>
        </div>
      </div>

      <!-- Model Name Section -->
      <div v-if="selectedFile" class="section">
        <div class="section-header">
          <h4>模型名称</h4>
          <small class="section-hint"
            >模型名称将用于在列表中显示和文件夹命名</small
          >
        </div>
        <InputText
          v-model="modelName"
          placeholder="留空将使用文件名"
          :disabled="isImporting"
          class="w-full" />
      </div>

      <!-- Model Preview Section -->
      <div v-if="previewInfo" class="section">
        <div class="section-header">
          <h4>模型预览</h4>
        </div>
        <div class="preview-grid">
          <div class="preview-item">
            <i class="pi pi-play text-primary"></i>
            <span>动作: {{ previewInfo.motionCount || 0 }} 个</span>
          </div>
          <div class="preview-item">
            <i class="pi pi-face-smile text-primary"></i>
            <span>表情: {{ previewInfo.expressionCount || 0 }} 个</span>
          </div>
          <div class="preview-item">
            <i class="pi pi-image text-primary"></i>
            <span>贴图: {{ previewInfo.textureCount || 0 }} 个</span>
          </div>
        </div>
      </div>

      <!-- Error Section -->
      <div v-if="importError" class="error-section">
        <i class="pi pi-exclamation-triangle"></i>
        <span>{{ importError }}</span>
      </div>

      <!-- Progress Section -->
      <div v-if="isImporting" class="progress-section">
        <div class="progress-content">
          <i class="pi pi-spin pi-spinner text-primary"></i>
          <span>{{ progressMessage || "正在导入模型..." }}</span>
        </div>
        <ProgressBar
          v-if="progressPercent !== null"
          :value="progressPercent"
          class="progress-bar" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-actions">
        <Button
          label="取消"
          icon="pi pi-times"
          text
          @click="closeDialog"
          :disabled="isImporting" />
        <Button
          label="导入"
          icon="pi pi-check"
          @click="importModel"
          :loading="isImporting"
          :disabled="!selectedFile || isImporting" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import ProgressBar from "primevue/progressbar";
import { open } from "@tauri-apps/plugin-dialog";
import { PetGlobalManager } from "./PetGlobalManager";
import { Logger } from "@/utils/logger";
import { getErrorDescription } from "@/api/ipc/wrapper";

interface Props {
  visible: boolean;
}

interface ModelPreviewInfo {
  motionCount: number;
  expressionCount: number;
  textureCount: number;
}

interface SelectedFile extends File {
  path?: string;
  version?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  "import-success": [modelName: string];
  "import-error": [error: string];
}>();

// Refs
const fileInputRef = ref<HTMLInputElement>();
const selectedFile = ref<SelectedFile | null>(null);
const modelName = ref("");
const isImporting = ref(false);
const importError = ref("");
const isDragOver = ref(false);
const progressMessage = ref("");
const progressPercent = ref<number | null>(null);
const previewInfo = ref<ModelPreviewInfo | null>(null);

// Computed
const isVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});

const fileDropClasses = computed(() => ({
  "drag-over": isDragOver.value,
  "has-file": !!selectedFile.value,
}));

// Watchers
watch(selectedFile, async (newFile) => {
  if (newFile?.name.endsWith(".zip")) {
    try {
      // 模拟预览信息
      previewInfo.value = {
        motionCount: Math.floor(Math.random() * 10) + 1,
        expressionCount: Math.floor(Math.random() * 8) + 1,
        textureCount: Math.floor(Math.random() * 5) + 1,
      };
    } catch (error) {
      Logger.warn("ModelImportDialog: 模型预览分析失败", String(error));
      previewInfo.value = null;
    }
  } else {
    previewInfo.value = null;
  }
});

// File handling methods
const triggerFileSelect = async () => {
  try {
    const filePath = await open({
      title: "选择 Live2D 模型文件",
      multiple: false,
      filters: [
        {
          name: "Live2D 模型文件",
          extensions: ["zip", "model.json", "model3.json", "model4.json"],
        },
      ],
    });

    if (filePath) {
      const fileName = filePath.split(/[/\\]/).pop() || "unknown";
      const mockFile = {
        name: fileName,
        path: filePath,
        size: 0,
        version: detectModelVersion(fileName),
      } as SelectedFile;

      setSelectedFile(mockFile);
    }
  } catch (error) {
    Logger.error("ModelImportDialog: 文件选择失败", String(error));
    importError.value = "文件选择失败";
  }
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    const fileWithVersion = Object.assign(file, {
      version: detectModelVersion(file.name),
    }) as SelectedFile;
    setSelectedFile(fileWithVersion);
  }
};

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    const fileWithVersion = Object.assign(file, {
      version: detectModelVersion(file.name),
    }) as SelectedFile;
    setSelectedFile(fileWithVersion);
  }
};

// Utility methods
const detectModelVersion = (fileName: string): string => {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("model4.json")) return "Cubism 4.x";
  if (lowerName.includes("model3.json")) return "Cubism 3.x";
  if (lowerName.includes("model.json")) return "Cubism 2.1";
  return "未知版本";
};

const setSelectedFile = (file: SelectedFile) => {
  const validExtensions = [
    ".zip",
    ".model.json",
    ".model3.json",
    ".model4.json",
  ];
  const isValid = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (!isValid) {
    importError.value =
      "不支持的文件格式，请选择 .zip、.model.json、.model3.json 或 .model4.json 文件";
    return;
  }

  if (file.size > 0 && file.size > 15 * 1024 * 1024) {
    importError.value = "文件过大，请选择小于 15MB 的文件";
    return;
  }

  selectedFile.value = file;
  modelName.value = file.name.replace(
    /\.(zip|model\.json|model3\.json|model4\.json)$/i,
    "",
  );
  importError.value = "";
};

const clearSelectedFile = () => {
  selectedFile.value = null;
  modelName.value = "";
  importError.value = "";
  previewInfo.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "未知大小";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const importModel = async () => {
  if (!selectedFile.value) return;

  isImporting.value = true;
  importError.value = "";
  progressMessage.value = "正在准备导入...";
  progressPercent.value = 0;

  try {
    const filePath = (selectedFile.value as any).path || selectedFile.value.name;
    const finalModelName = modelName.value.trim() || undefined;

    progressMessage.value = "正在验证文件...";
    progressPercent.value = 25;

    progressMessage.value = "正在导入模型文件...";
    progressPercent.value = 50;

    const importedName = await PetGlobalManager.importModel(filePath, finalModelName);

    progressMessage.value = "正在刷新模型缓存...";
    progressPercent.value = 75;
    await PetGlobalManager.refreshModelCache();

    progressMessage.value = "导入完成！";
    progressPercent.value = 100;

    Logger.info("ModelImportDialog: 模型导入成功", importedName);
    emit("import-success", importedName);

    closeDialog();
  } catch (error) {
    let errorMessage = "未知错误";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      const errorStr = JSON.stringify(error, null, 2);
      if ("message" in error && error.message) {
        errorMessage = String(error.message);
      } else if ("name" in error && error.name === "ApiError" && "code" in error) {
        const errorCode = typeof error.code === "number" ? error.code : 1000;
        const errorDesc = getErrorDescription(errorCode);
        errorMessage = `API错误 (${errorCode}): ${errorDesc}`;
      } else if ("code" in error && "data" in error) {
        errorMessage = `API错误 (${error.code}): ${"message" in error ? error.message : "未知错误"}`;
      } else {
        errorMessage = errorStr;
      }
    }

    importError.value = errorMessage;
    Logger.error("ModelImportDialog: 模型导入失败", `错误信息: ${errorMessage}`);
    emit("import-error", errorMessage);
    progressMessage.value = "";
    progressPercent.value = null;
    isImporting.value = false;
  }
};

// Dialog methods
const closeDialog = () => {
  if (isImporting.value) return;

  isVisible.value = false;
  resetDialog();
};

const handleDialogHide = () => {
  if (!isImporting.value) {
    resetDialog();
  }
};

const resetDialog = () => {
  clearSelectedFile();
  progressMessage.value = "";
  progressPercent.value = null;
};
</script>

<style scoped lang="less">
.import-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .section-header {
    h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
    }
  }

  .section-description {
    font-size: 0.875rem;
    color: var(--text-color-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .section-hint {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
    display: block;
  }
}

.file-drop-zone {
  border: 2px dashed var(--surface-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--surface-ground);

  &:hover,
  &.drag-over {
    border-color: var(--primary-color);
    background: var(--primary-50);

    [data-theme="dark"] & {
      background: var(--primary-950);
    }
  }

  &.has-file {
    border-style: solid;
    border-color: var(--green-400);
    background: var(--green-50);

    [data-theme="dark"] & {
      background: var(--green-950);
    }
  }

  .drop-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.5rem;

    i {
      font-size: 3rem;
      margin-bottom: 0.75rem;
      color: var(--text-color-secondary);
    }

    p {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      margin: 0;
      color: var(--text-color);
    }

    span {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }
  }

  .selected-file-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--surface-0);
    border-radius: 0.5rem;
    border: 1px solid var(--surface-border);

    [data-theme="dark"] & {
      background: var(--surface-900);
      border-color: var(--surface-700);
    }

    i {
      font-size: 1.875rem;
      color: var(--primary-color);
    }

    .file-details {
      flex: 1;

      .file-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-color);
        margin: 0 0 0.25rem 0;
      }

      .file-size {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        margin: 0 0 0.25rem 0;
      }

      .file-version {
        font-size: 0.75rem;
        color: var(--primary-color);
        font-weight: 500;
        margin: 0;
      }
    }
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  border: 1px solid var(--surface-border);

  .preview-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-color-secondary);

    i {
      color: var(--primary-color);
    }
  }
}

.error-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--red-50);
  border: 1px solid var(--red-200);
  border-radius: 0.5rem;
  color: var(--red-700);
  font-size: 0.875rem;

  [data-theme="dark"] & {
    background: var(--red-950);
    border-color: var(--red-800);
    color: var(--red-300);
  }
}

.progress-section {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .progress-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--text-color-secondary);

    i {
      color: var(--primary-color);
    }
  }

  .progress-bar {
    width: 100%;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
