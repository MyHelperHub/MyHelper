<template>
  <div class="file-search-options">
    <div class="options-header">
      <span class="options-title">搜索选项</span>
      <button class="reset-btn" @click="resetToDefaults">
        <i class="pi pi-refresh"></i>
      </button>
    </div>

    <div class="options-list">
      <!-- 搜索路径 -->
      <div class="option-item">
        <label class="option-label">搜索路径</label>
        <div class="path-selector">
          <div class="paths-list">
            <div
              v-for="(path, index) in options.paths"
              :key="index"
              v-tooltip.bottom="{ value: path, escape: false, showDelay: 300 }"
              class="path-tag">
              <span class="path-text">{{ path }}</span>
              <i class="pi pi-times" @click="removePath(index)"></i>
            </div>
          </div>
          <button class="add-path-btn" @click="selectPath">
            <i class="pi pi-plus"></i>
            <span>添加路径</span>
          </button>
        </div>
      </div>

      <!-- 最大深度 -->
      <div class="option-item">
        <label class="option-label">最大深度</label>
        <InputNumber
          v-model="options.maxDepth"
          :min="1"
          :max="50"
          show-buttons
          :pt="{
            root: { class: 'depth-input' },
          }" />
      </div>

      <!-- 文件类型 -->
      <div class="option-item">
        <label class="option-label">文件类型</label>
        <Select
          v-model="options.fileType"
          :options="fileTypeOptions"
          option-label="label"
          option-value="value"
          placeholder="全部类型"
          :pt="{
            root: { class: 'file-type-select' },
          }" />
      </div>

      <!-- 扩展名过滤 -->
      <div class="option-item">
        <label class="option-label">仅搜索特定扩展名</label>
        <InputText
          v-model="extensionInput"
          placeholder="例：js,ts,vue (逗号分隔)"
          @blur="updateExtensions"
          :pt="{
            root: { class: 'extension-input' },
          }" />
      </div>

      <!-- 开关选项 -->
      <div class="option-item">
        <div class="toggle-option">
          <label class="toggle-label">使用正则表达式</label>
          <InputSwitch v-model="options.isGlob" />
        </div>
      </div>

      <div class="option-item">
        <div class="toggle-option">
          <label class="toggle-label">包含隐藏文件</label>
          <InputSwitch v-model="options.hidden" />
        </div>
      </div>

      <div class="option-item">
        <div class="toggle-option">
          <label class="toggle-label">忽略 .gitignore</label>
          <InputSwitch v-model="options.noIgnore" />
        </div>
      </div>

      <div class="option-item">
        <div class="toggle-option">
          <label class="toggle-label">大小写敏感</label>
          <InputSwitch v-model="options.caseSensitive" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import InputNumber from "primevue/inputnumber";
import Select from "primevue/select";
import InputText from "primevue/inputtext";
import InputSwitch from "primevue/inputswitch";
import { open } from "@tauri-apps/plugin-dialog";
import { desktopDir } from "@tauri-apps/api/path";
import { Logger } from "@/utils/logger";
import { showMessage } from "@/composables/message.ts";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const extensionInput = ref("");

const fileTypeOptions = [
  { label: "全部类型", value: null },
  { label: "仅文件", value: "file" },
  { label: "仅目录", value: "directory" },
  { label: "符号链接", value: "symlink" },
  { label: "可执行文件", value: "executable" },
];

const options = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

function updateExtensionInput() {
  if (options.value.extension && options.value.extension.length > 0) {
    extensionInput.value = options.value.extension.join(",");
  } else {
    extensionInput.value = "";
  }
}

function updateExtensions() {
  if (extensionInput.value.trim()) {
    options.value = {
      ...options.value,
      extension: extensionInput.value
        .split(",")
        .map((ext) => ext.trim())
        .filter((ext) => ext.length > 0),
    };
  } else {
    options.value = {
      ...options.value,
      extension: [],
    };
  }
}

async function selectPath() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "选择搜索路径",
    });

    if (!selected) return;

    // 标准化路径（统一斜杠方向）
    const normalize = (p) => p.replace(/\\/g, "/").replace(/\/$/, "");
    const normalizedSelected = normalize(selected);

    // 检查是否已存在相同路径
    if (options.value.paths.some((p) => normalize(p) === normalizedSelected)) {
      showMessage("该路径已存在", 3000, 2);
      return;
    }

    let newPaths = [...options.value.paths];

    // 检查新路径是否是已有路径的父路径
    const childPaths = newPaths.filter((p) => {
      const normalized = normalize(p);
      return normalized.startsWith(normalizedSelected + "/");
    });

    if (childPaths.length > 0) {
      // 移除所有子路径，添加父路径
      newPaths = newPaths.filter((p) => !childPaths.includes(p));
      newPaths.push(selected);
      showMessage(`已移除 ${childPaths.length} 个子路径`, 3000, 1);
    } else {
      // 检查新路径是否是已有路径的子路径
      const isChildOfExisting = newPaths.some((p) => {
        const normalized = normalize(p);
        return normalizedSelected.startsWith(normalized + "/");
      });

      if (isChildOfExisting) {
        showMessage("该路径已被父路径包含", 3000, 2);
        return;
      }

      // 添加新路径
      newPaths.push(selected);
    }

    options.value = {
      ...options.value,
      paths: newPaths,
    };
  } catch (error) {
    Logger.error(error, "选择路径失败");
  }
}

function removePath(index) {
  if (options.value.paths.length <= 1) {
    showMessage("至少需要一个搜索路径", 3000, 2);
    return;
  }
  const newPaths = [...options.value.paths];
  newPaths.splice(index, 1);
  options.value = {
    ...options.value,
    paths: newPaths,
  };
}

async function resetToDefaults() {
  try {
    const desktop = await desktopDir();
    options.value = {
      paths: [desktop],
      maxDepth: 10,
      hidden: false,
      noIgnore: false,
      caseSensitive: false,
      fileType: null,
      extension: [],
      isGlob: false,
    };
  } catch (error) {
    Logger.error(error, "获取桌面路径失败");
    options.value = {
      paths: ["."],
      maxDepth: 10,
      hidden: false,
      noIgnore: false,
      caseSensitive: false,
      fileType: null,
      extension: [],
      isGlob: false,
    };
  }
  extensionInput.value = "";
}
</script>

<style lang="less" scoped>
.file-search-options {
  padding: 6px;
  min-width: auto;

  .options-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 6px 6px;
    border-bottom: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));

    .options-title {
      font-size: 10px;
      font-weight: 600;
      color: var(--theme-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .reset-btn {
      background: transparent;
      border: none;
      color: var(--theme-text-muted);
      cursor: pointer;
      padding: 3px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
        color: var(--theme-primary);
      }

      i {
        font-size: 11px;
      }
    }
  }

  .options-list {
    padding: 6px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .option-item {
      display: flex;
      flex-direction: column;
      gap: 5px;

      .option-label {
        font-size: 11px;
        font-weight: 500;
        color: var(--theme-text-secondary);
      }

      .path-selector {
        display: flex;
        flex-direction: column;
        gap: 5px;

        .paths-list {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;

          .path-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 6px;
            background: rgba(
              var(--theme-primary-rgb),
              var(--theme-transparency-border)
            );
            border-radius: 3px;
            font-size: 10px;
            color: var(--theme-text);

            .path-text {
              max-width: 120px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            i {
              font-size: 9px;
              color: var(--theme-text-muted);
              cursor: pointer;
              transition: color 0.2s ease;

              &:hover {
                color: var(--theme-primary);
              }
            }
          }
        }

        .add-path-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 5px 8px;
          background: transparent;
          border: 1px dashed
            rgba(var(--theme-border-rgb), var(--theme-transparency-border));
          border-radius: 4px;
          color: var(--theme-text-secondary);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: rgba(
              var(--theme-primary-rgb),
              var(--theme-transparency-border)
            );
            border-color: var(--theme-primary);
            color: var(--theme-primary);
          }

          i {
            font-size: 10px;
          }
        }
      }

      .toggle-option {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .toggle-label {
          font-size: 11px;
          color: var(--theme-text);
        }
      }
    }
  }
}

:deep(.depth-input),
:deep(.file-type-select),
:deep(.extension-input) {
  width: 100%;
  font-size: 11px;
}

:deep(.p-inputnumber-button) {
  width: 24px;
}

:deep(.p-select) {
  font-size: 11px;
}
</style>
