<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="自定义主题配置"
    :style="{ width: '900px', maxHeight: '85vh' }"
    class="custom-theme-dialog">
    <div class="dialog-content">
      <div class="layout-container">
        <!-- 左侧配置区域 -->
        <div class="config-panel">
          <!-- 透明度配置 -->
          <div class="config-section">
            <h5><i class="pi pi-eye"></i> 背景透明度</h5>
            <div class="transparency-controls">
              <div class="slider-group">
                <label>主背景透明度</label>
                <div class="slider-container">
                  <Slider
                    v-model="localConfig.transparency.background"
                    :min="0.1"
                    :max="1"
                    :step="0.05"
                    @update:modelValue="updateTransparency" />
                  <span class="slider-value"
                    >{{
                      Math.round(localConfig.transparency.background * 100)
                    }}%</span
                  >
                </div>
              </div>

              <div class="slider-group">
                <label>次要背景透明度</label>
                <div class="slider-container">
                  <Slider
                    v-model="localConfig.transparency.backgroundSecondary"
                    :min="0.1"
                    :max="1"
                    :step="0.05"
                    @update:modelValue="updateTransparency" />
                  <span class="slider-value"
                    >{{
                      Math.round(
                        localConfig.transparency.backgroundSecondary * 100,
                      )
                    }}%</span
                  >
                </div>
              </div>

              <div class="slider-group">
                <label>卡片透明度</label>
                <div class="slider-container">
                  <Slider
                    v-model="localConfig.transparency.card"
                    :min="0.1"
                    :max="1"
                    :step="0.05"
                    @update:modelValue="updateTransparency" />
                  <span class="slider-value"
                    >{{
                      Math.round(localConfig.transparency.card * 100)
                    }}%</span
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 主要颜色配置 -->
          <div class="config-section">
            <h5><i class="pi pi-palette"></i> 主要颜色</h5>
            <div class="color-grid">
              <div class="color-item">
                <label>主色调</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.primary"
                    format="hex"
                    @update:modelValue="updateColor('primary', $event)" />
                  <InputText
                    v-model="localConfig.colors.primary"
                    @update:modelValue="updateColor('primary', $event)"
                    class="color-input"
                    placeholder="#4f6df5" />
                </div>
              </div>

              <div class="color-item">
                <label>背景色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.background"
                    format="hex"
                    @update:modelValue="updateColor('background', $event)" />
                  <InputText
                    v-model="localConfig.colors.background"
                    @update:modelValue="updateColor('background', $event)"
                    class="color-input"
                    placeholder="#ffffff" />
                </div>
              </div>

              <div class="color-item">
                <label>次要背景色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.backgroundSecondary"
                    format="hex"
                    @update:modelValue="
                      updateColor('backgroundSecondary', $event)
                    " />
                  <InputText
                    v-model="localConfig.colors.backgroundSecondary"
                    @update:modelValue="
                      updateColor('backgroundSecondary', $event)
                    "
                    class="color-input"
                    placeholder="#f8fafc" />
                </div>
              </div>
            </div>
          </div>

          <!-- 文字颜色配置 -->
          <div class="config-section">
            <h5><i class="pi pi-font"></i> 文字颜色</h5>
            <div class="color-grid">
              <div class="color-item">
                <label>主要文字</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.text"
                    format="hex"
                    @update:modelValue="updateColor('text', $event)" />
                  <InputText
                    v-model="localConfig.colors.text"
                    @update:modelValue="updateColor('text', $event)"
                    class="color-input"
                    placeholder="#1e293b" />
                </div>
              </div>

              <div class="color-item">
                <label>次要文字</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.textSecondary"
                    format="hex"
                    @update:modelValue="updateColor('textSecondary', $event)" />
                  <InputText
                    v-model="localConfig.colors.textSecondary"
                    @update:modelValue="updateColor('textSecondary', $event)"
                    class="color-input"
                    placeholder="#475569" />
                </div>
              </div>
            </div>
          </div>

          <!-- 功能颜色配置 -->
          <div class="config-section">
            <h5><i class="pi pi-circle-fill"></i> 功能颜色</h5>
            <div class="color-grid">
              <div class="color-item">
                <label>成功色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.success"
                    format="hex"
                    @update:modelValue="updateColor('success', $event)" />
                  <InputText
                    v-model="localConfig.colors.success"
                    @update:modelValue="updateColor('success', $event)"
                    class="color-input"
                    placeholder="#10b981" />
                </div>
              </div>

              <div class="color-item">
                <label>警告色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.warning"
                    format="hex"
                    @update:modelValue="updateColor('warning', $event)" />
                  <InputText
                    v-model="localConfig.colors.warning"
                    @update:modelValue="updateColor('warning', $event)"
                    class="color-input"
                    placeholder="#f59e0b" />
                </div>
              </div>

              <div class="color-item">
                <label>错误色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.error"
                    format="hex"
                    @update:modelValue="updateColor('error', $event)" />
                  <InputText
                    v-model="localConfig.colors.error"
                    @update:modelValue="updateColor('error', $event)"
                    class="color-input"
                    placeholder="#ef4444" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧预览区域 -->
        <div class="preview-panel">
          <div class="config-section">
            <h5><i class="pi pi-eye"></i> 实时预览</h5>

            <!-- 主题预览卡片 -->
            <div class="preview-container" :style="previewStyles">
              <div class="preview-card" :style="previewCardStyles">
                <div class="preview-header">
                  <i
                    class="pi pi-palette"
                    :style="{ color: localConfig.colors.primary }"></i>
                  <span>主题预览</span>
                </div>
                <div class="preview-content">
                  <p
                    class="preview-text"
                    :style="{ color: localConfig.colors.text }">
                    这是主要文字颜色
                  </p>
                  <p
                    class="preview-text-secondary"
                    :style="{ color: localConfig.colors.textSecondary }">
                    这是次要文字颜色
                  </p>
                  <div class="preview-buttons">
                    <Button
                      label="主要按钮"
                      size="small"
                      :style="{
                        backgroundColor: localConfig.colors.primary,
                        borderColor: localConfig.colors.primary,
                        color: 'white',
                      }" />
                    <Button
                      label="成功按钮"
                      size="small"
                      :style="{
                        backgroundColor: localConfig.colors.success,
                        borderColor: localConfig.colors.success,
                        color: 'white',
                      }" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 透明度效果预览 -->
            <div class="transparency-preview">
              <div class="transparency-demo" :style="transparencyDemoStyles">
                <div class="demo-content">
                  <h6>透明度效果</h6>
                  <div class="transparency-info">
                    <div class="info-item">
                      <span class="label">主背景:</span>
                      <span class="value"
                        >{{
                          Math.round(localConfig.transparency.background * 100)
                        }}%</span
                      >
                    </div>
                    <div class="info-item">
                      <span class="label">次要背景:</span>
                      <span class="value"
                        >{{
                          Math.round(
                            localConfig.transparency.backgroundSecondary * 100,
                          )
                        }}%</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 颜色面板预览 -->
            <div class="color-palette-preview">
              <h6>颜色面板</h6>
              <div class="color-swatches">
                <div
                  class="swatch"
                  :style="{ backgroundColor: localConfig.colors.primary }">
                  <span>主色</span>
                </div>
                <div
                  class="swatch"
                  :style="{ backgroundColor: localConfig.colors.success }">
                  <span>成功</span>
                </div>
                <div
                  class="swatch"
                  :style="{ backgroundColor: localConfig.colors.warning }">
                  <span>警告</span>
                </div>
                <div
                  class="swatch"
                  :style="{ backgroundColor: localConfig.colors.error }">
                  <span>错误</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <Button label="重置" severity="secondary" @click="resetConfig" />
        <Button label="取消" severity="secondary" @click="closeDialog" />
        <Button label="应用主题" severity="info" @click="applyConfig" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import Slider from "primevue/slider";
import ColorPicker from "primevue/colorpicker";
import InputText from "primevue/inputtext";
import { colorUtils, presetThemes } from "@/themes/theme";
import { showMessage } from "@/utils/message";

interface CustomThemeConfig {
  transparency: {
    background: number;
    backgroundSecondary: number;
    card: number;
  };
  colors: {
    primary: string;
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
  };
}

const props = defineProps<{
  visible: boolean;
  currentTheme?: any;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  apply: [config: CustomThemeConfig];
}>();

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const createConfigFromTheme = (theme?: any): CustomThemeConfig => {
  const defaultTransparency = {
    background: 0.9,
    backgroundSecondary: 0.8,
    card: 0.85,
  };

  // 如果有自定义颜色配置
  if (theme?.customColors) {
    return {
      transparency: theme.customColors.transparency || defaultTransparency,
      colors: {
        primary: theme.customColors.primary?.hex || "#4f6df5",
        background: theme.customColors.background?.hex || "#ffffff",
        backgroundSecondary:
          theme.customColors.backgroundSecondary?.hex || "#f8fafc",
        text: theme.customColors.text?.hex || "#1e293b",
        textSecondary: theme.customColors.textSecondary?.hex || "#475569",
        success: theme.customColors.success?.hex || "#10b981",
        warning: theme.customColors.warning?.hex || "#f59e0b",
        error: theme.customColors.error?.hex || "#ef4444",
      },
    };
  } 
  // 如果有预设主题ID
  else if (theme?.currentThemeId) {
    const preset = presetThemes.find((p) => p.id === theme.currentThemeId);
    if (preset) {
      return {
        transparency: preset.colors.transparency || defaultTransparency,
        colors: {
          primary: preset.colors.primary.hex,
          background: preset.colors.background.hex,
          backgroundSecondary: preset.colors.backgroundSecondary.hex,
          text: preset.colors.text.hex,
          textSecondary: preset.colors.textSecondary.hex,
          success: preset.colors.success.hex,
          warning: preset.colors.warning.hex,
          error: preset.colors.error.hex,
        },
      };
    }
  }

  // 默认配置（基于浅色主题）
  const defaultTheme = presetThemes.find(p => p.id === "default-light");
  if (defaultTheme) {
    return {
      transparency: defaultTheme.colors.transparency || defaultTransparency,
      colors: {
        primary: defaultTheme.colors.primary.hex,
        background: defaultTheme.colors.background.hex,
        backgroundSecondary: defaultTheme.colors.backgroundSecondary.hex,
        text: defaultTheme.colors.text.hex,
        textSecondary: defaultTheme.colors.textSecondary.hex,
        success: defaultTheme.colors.success.hex,
        warning: defaultTheme.colors.warning.hex,
        error: defaultTheme.colors.error.hex,
      },
    };
  }

  // 最后的后备配置
  return {
    transparency: defaultTransparency,
    colors: {
      primary: "#4f6df5",
      background: "#ffffff",
      backgroundSecondary: "#f8fafc",
      text: "#1e293b",
      textSecondary: "#475569",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
    },
  };
};

const localConfig = ref<CustomThemeConfig>(createConfigFromTheme());

// 通用的RGB转RGBA函数
const toRgba = (rgbStr: string, alpha: number) => {
  if (rgbStr && rgbStr.startsWith('rgb(')) {
    return rgbStr.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  return `rgba(255, 255, 255, ${alpha})`; // 后备方案
};

const previewStyles = computed(() => {
  const bgRgb = colorUtils.hexToRgb(localConfig.value.colors.background);
  const bgSecondaryRgb = colorUtils.hexToRgb(
    localConfig.value.colors.backgroundSecondary,
  );
  const primaryRgb = colorUtils.hexToRgb(localConfig.value.colors.primary);

  return {
    background: `linear-gradient(145deg, ${toRgba(bgRgb, localConfig.value.transparency.background)}, ${toRgba(bgSecondaryRgb, localConfig.value.transparency.backgroundSecondary)}, ${toRgba(primaryRgb, 0.1)})`,
    backdropFilter: "blur(20px)",
    borderRadius: "12px",
    border: `1px solid ${localConfig.value.colors.backgroundSecondary}40`,
    padding: "16px",
    color: localConfig.value.colors.text,
    minHeight: "200px",
  };
});

const previewCardStyles = computed(() => {
  const cardBgRgb = colorUtils.hexToRgb(localConfig.value.colors.background);
  
  return {
    background: toRgba(cardBgRgb, localConfig.value.transparency.card),
    backdropFilter: "blur(10px)",
    borderRadius: "8px",
    border: `1px solid ${localConfig.value.colors.backgroundSecondary}60`,
    padding: "12px",
    color: localConfig.value.colors.text,
    marginBottom: "12px",
  };
});

const transparencyDemoStyles = computed(() => {
  const bgRgb = colorUtils.hexToRgb(localConfig.value.colors.background);
  
  return {
    background: `linear-gradient(135deg, ${toRgba(bgRgb, localConfig.value.transparency.background)} 0%, ${toRgba(bgRgb, localConfig.value.transparency.backgroundSecondary)} 100%)`,
    backdropFilter: "blur(15px)",
    borderRadius: "8px",
    border: `1px solid ${localConfig.value.colors.backgroundSecondary}40`,
    padding: "12px",
    color: localConfig.value.colors.text,
    marginTop: "12px",
  };
});

const updateTransparency = () => {
  // 透明度更新时的逻辑处理
};

const updateColor = (colorKey: string, value: string | undefined) => {
  if (!value) return;
  
  let hexColor = value;
  
  // 如果不是以#开头，尝试转换
  if (!hexColor.startsWith("#")) {
    // 如果是rgb格式，转换为hex
    if (hexColor.startsWith("rgb")) {
      hexColor = colorUtils.rgbToHex(hexColor);
    } else {
      // 添加#前缀
      hexColor = `#${hexColor}`;
    }
  }
  
  // 验证hex格式
  if (/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
    localConfig.value.colors[
      colorKey as keyof typeof localConfig.value.colors
    ] = hexColor;
  }
};

const resetConfig = () => {
  localConfig.value = createConfigFromTheme(props.currentTheme);
  showMessage("配置已重置", 2000, 1);
};

const closeDialog = () => {
  isVisible.value = false;
};

const applyConfig = () => {
  emit("apply", localConfig.value);
  closeDialog();
  showMessage("主题配置已应用", 2000, 1);
};

// 监听弹窗打开，重置配置
watch(isVisible, (newVal) => {
  if (newVal) {
    localConfig.value = createConfigFromTheme(props.currentTheme);
  }
});

// 监听currentTheme变化
watch(
  () => props.currentTheme,
  (newTheme) => {
    if (isVisible.value) {
      localConfig.value = createConfigFromTheme(newTheme);
    }
  },
  { deep: true },
);
</script>

<style lang="less" scoped>
.custom-theme-dialog {
  .dialog-content {
    max-height: 70vh;
    overflow: hidden;
    padding: 0;
  }

  .layout-container {
    display: flex;
    gap: 20px;
    height: 100%;
  }

  .config-panel {
    flex: 1;
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--theme-border-light);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--theme-border);
      border-radius: 3px;
    }
  }

  .preview-panel {
    flex: 1;
    min-width: 300px;
  }

  .config-section {
    margin-bottom: 24px;

    h5 {
      margin: 0 0 16px 0;
      color: var(--theme-text);
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;

      i {
        color: var(--theme-primary);
        font-size: 14px;
      }
    }

    h6 {
      margin: 0 0 12px 0;
      color: var(--theme-text);
      font-size: 14px;
      font-weight: 500;
    }
  }

  .transparency-controls {
    .slider-group {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 8px;
        color: var(--theme-text-secondary);
        font-size: 13px;
        font-weight: 500;
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: 12px;

        .p-slider {
          flex: 1;
        }

        .slider-value {
          min-width: 45px;
          text-align: center;
          font-size: 12px;
          color: var(--theme-text-muted);
          background: var(--theme-background-secondary);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
      }
    }
  }

  .color-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    .color-item {
      label {
        display: block;
        margin-bottom: 8px;
        color: var(--theme-text-secondary);
        font-size: 13px;
        font-weight: 500;
      }

      .color-picker-container {
        display: flex;
        align-items: center;
        gap: 8px;

        .p-colorpicker {
          flex-shrink: 0;
        }

        .color-input {
          flex: 1;
          font-size: 12px;
          padding: 6px 8px;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        }
      }
    }
  }

  .preview-container {
    position: relative;
    min-height: 200px;

    .preview-card {
      .preview-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-weight: 500;
        font-size: 14px;

        i {
          font-size: 16px;
        }
      }

      .preview-content {
        .preview-text {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 500;
        }

        .preview-text-secondary {
          margin: 0 0 16px 0;
          font-size: 12px;
        }

        .preview-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }
      }
    }
  }

  .transparency-preview {
    .transparency-demo {
      .demo-content {
        h6 {
          margin: 0 0 8px 0;
          font-size: 13px;
        }

        .transparency-info {
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 11px;

            .label {
              color: var(--theme-text-secondary);
            }

            .value {
              font-weight: 600;
              background: rgba(var(--theme-primary-rgb), 0.1);
              padding: 1px 4px;
              border-radius: 3px;
            }
          }
        }
      }
    }
  }

  .color-palette-preview {
    margin-top: 16px;

    .color-swatches {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .swatch {
        height: 40px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .dialog-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--theme-border-light);
    margin-top: 16px;
  }
}
</style>
