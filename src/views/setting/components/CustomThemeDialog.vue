<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="自定义主题配置"
    :style="{ width: '96vw', height: '85vh' }"
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
                    :step="0.05" />
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
                    :step="0.05" />
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
                    :step="0.05" />
                  <span class="slider-value"
                    >{{
                      Math.round(localConfig.transparency.card * 100)
                    }}%</span
                  >
                </div>
              </div>

              <div class="slider-group">
                <label>边框透明度</label>
                <div class="slider-container">
                  <Slider
                    v-model="localConfig.transparency.border"
                    :min="0.1"
                    :max="1"
                    :step="0.05" />
                  <span class="slider-value"
                    >{{
                      Math.round(localConfig.transparency.border * 100)
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
                    format="hex" />
                  <InputText
                    v-model="localConfig.colors.primary"
                    class="color-input"
                    placeholder="#4f6df5" />
                </div>
              </div>

              <div class="color-item">
                <label>背景色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.background"
                    format="hex" />
                  <InputText
                    v-model="localConfig.colors.background"
                    class="color-input"
                    placeholder="#ffffff" />
                </div>
              </div>

              <div class="color-item">
                <label>次要背景色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.backgroundSecondary"
                    format="hex" />
                  <InputText
                    v-model="localConfig.colors.backgroundSecondary"
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
                  <ColorPicker v-model="localConfig.colors.text" format="hex" />
                  <InputText
                    v-model="localConfig.colors.text"
                    class="color-input"
                    placeholder="#1e293b" />
                </div>
              </div>

              <div class="color-item">
                <label>次要文字</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.textSecondary"
                    format="hex" />
                  <InputText
                    v-model="localConfig.colors.textSecondary"
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
                    format="hex" />
                  <InputText
                    v-model="localConfig.colors.success"
                    class="color-input"
                    placeholder="#10b981" />
                </div>
              </div>

              <div class="color-item">
                <label>警告色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.warning"
                    format="hex" />
                  <InputText
                    v-model="localConfig.colors.warning"
                    class="color-input"
                    placeholder="#f59e0b" />
                </div>
              </div>

              <div class="color-item">
                <label>错误色</label>
                <div class="color-picker-container">
                  <ColorPicker
                    v-model="localConfig.colors.error"
                    format="hex" />
                  <InputText
                    v-model="localConfig.colors.error"
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
                    <div class="info-item">
                      <span class="label">边框透明度</span>
                      <span class="value"
                        >{{
                          Math.round(localConfig.transparency.border * 100)
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
import { colorUtils } from "@/themes/theme";
import { showMessage } from "@/composables/message";

interface CustomThemeConfig {
  transparency: {
    background: number;
    backgroundSecondary: number;
    card: number;
    border: number;
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

const props = defineProps<{ visible: boolean; currentTheme?: any }>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  apply: [config: CustomThemeConfig];
}>();

// 双向绑定弹窗显示状态
const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

// 从 CSS 变量读取颜色值
const getColorFromCSSVar = (varName: string): string => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  if (value.startsWith("rgb")) return colorUtils.rgbToHex(value);
  if (value.startsWith("#")) return value;
  if (/^[a-fA-F0-9]{6}$/.test(value)) return `#${value.toLowerCase()}`;
  return "";
};

// 获取当前主题配置（从 CSS 变量）
const getCurrentThemeColors = (): CustomThemeConfig => {
  const gs = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const bgAlpha = gs("--theme-transparency-background");
  const bgSecondaryAlpha = gs("--theme-transparency-background-secondary");
  const cardAlpha = gs("--theme-transparency-card");
  const borderAlpha = gs("--theme-transparency-border");

  return {
    transparency: {
      background: bgAlpha ? parseFloat(bgAlpha) : 0.9,
      backgroundSecondary: bgSecondaryAlpha
        ? parseFloat(bgSecondaryAlpha)
        : 0.8,
      card: cardAlpha ? parseFloat(cardAlpha) : 0.85,
      border: borderAlpha ? parseFloat(borderAlpha) : 0.3,
    },
    colors: {
      primary: getColorFromCSSVar("--theme-primary") || "#4f6df5",
      background: getColorFromCSSVar("--theme-background") || "#ffffff",
      backgroundSecondary:
        getColorFromCSSVar("--theme-background-secondary") || "#f8fafc",
      text: getColorFromCSSVar("--theme-text") || "#1e293b",
      textSecondary: getColorFromCSSVar("--theme-text-secondary") || "#475569",
      success: getColorFromCSSVar("--theme-success") || "#10b981",
      warning: getColorFromCSSVar("--theme-warning") || "#f59e0b",
      error: getColorFromCSSVar("--theme-error") || "#ef4444",
    },
  };
};

// 工作配置与原始配置
const localConfig = ref<CustomThemeConfig>(getCurrentThemeColors());
const originalConfig = ref<CustomThemeConfig>(getCurrentThemeColors());

// 将十六进制或 rgb 转为 rgba
const toRgba = (hexOrRgb: string, alpha: number) => {
  if (!hexOrRgb) return `rgba(255, 255, 255, ${alpha})`;
  const rgbStr = hexOrRgb.startsWith("#")
    ? colorUtils.hexToRgb(hexOrRgb)
    : hexOrRgb;
  return rgbStr.startsWith("rgb(")
    ? rgbStr.replace("rgb(", "rgba(").replace(")", `, ${alpha})`)
    : `rgba(255, 255, 255, ${alpha})`;
};

// 预览容器样式
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
  } as Record<string, string>;
});

// 预览卡片样式
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
  } as Record<string, string>;
});

// 透明度演示样式
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
  } as Record<string, string>;
});

// 操作：重置、取消、应用
const resetConfig = () => {
  localConfig.value = JSON.parse(JSON.stringify(originalConfig.value));
  showMessage("配置已重置", 2000, 1);
};

const closeDialog = () => {
  localConfig.value = JSON.parse(JSON.stringify(originalConfig.value));
  isVisible.value = false;
};

const applyConfig = () => {
  emit("apply", localConfig.value);
  originalConfig.value = JSON.parse(JSON.stringify(localConfig.value));
  isVisible.value = false;
  showMessage("主题配置已应用", 2000, 1);
};

// 打开时刷新配置
watch(isVisible, (open) => {
  if (open) {
    const config = getCurrentThemeColors();
    localConfig.value = JSON.parse(JSON.stringify(config));
    originalConfig.value = JSON.parse(JSON.stringify(config));
  }
});
</script>

<style lang="less">
.custom-theme-dialog {
  padding: 6px;
  /* 让 Dialog 本体按列布局，并固定高度，便于内容区占满剩余空间 */
  &.p-dialog {
    display: flex;
    flex-direction: column;
    height: 85vh;
  }

  /* 让 PrimeVue 内容区占满剩余空间，并作为弹性容器承载内部布局 */
  .p-dialog-content {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .dialog-content {
    /* 占满内容区剩余空间，避免被父容器裁切 */
    flex: 1 1 auto;
    overflow: hidden;
    padding: 0;
  }

  .layout-container {
    display: flex;
    gap: 20px;
    height: 100%;

    .config-panel {
      flex: 1;
      /* 让面板自身占满容器高度，滚动在此处产生 */
      height: 100%;
      min-height: 0; // 允许在flex容器内正确产生内部滚动
      overflow-y: auto;
      padding-right: 8px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--theme-border);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
        border-radius: 3px;
      }
    }

    .preview-panel {
      flex: 1;
      min-width: 300px;
      height: 100%;
      min-height: 0; // 允许在flex容器内正确产生内部滚动
      overflow-y: auto;
      padding-right: 8px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: var(--theme-border);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(
          var(--theme-background-secondary-rgb),
          var(--theme-transparency-background-secondary)
        );
        border-radius: 3px;
      }
    }
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
        color: var(--theme-text-muted);
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
          background: rgba(
            var(--theme-background-secondary-rgb),
            var(--theme-transparency-background-secondary)
          );
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
        color: var(--theme-text-muted);
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
              color: var(--theme-text-muted);
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
        color: var(--theme-background);
        font-size: 11px;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(var(--theme-text-rgb), 0.3);
        box-shadow: var(--theme-shadow-sm);
      }
    }
  }

  .dialog-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));
    margin-top: 16px;
  }
}
</style>
