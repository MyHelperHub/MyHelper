<template>
  <div class="theme-settings">
    <h4>主题设置</h4>

    <!-- 主题模式切换 -->
    <div class="setting-item">
      <div class="setting-label">
        <span>主题模式</span>
        <small>选择亮色或暗色主题</small>
      </div>
      <div class="theme-mode-selector">
        <Button
          v-for="mode in themeModes"
          :key="mode.value"
          :label="mode.label"
          :severity="currentConfig.mode === mode.value ? 'info' : 'secondary'"
          :variant="currentConfig.mode === mode.value ? 'filled' : 'outlined'"
          size="small"
          @click="switchThemeMode(mode.value)"
          class="mode-button" />
      </div>
    </div>

    <!-- 预设主题选择 -->
    <div class="setting-item">
      <div class="setting-label">
        <span>预设主题</span>
        <small>选择内置的主题方案</small>
      </div>
      <div class="preset-themes-grid">
        <div
          v-for="theme in presetThemes"
          :key="theme.id"
          :class="[
            'preset-theme-card',
            { active: currentConfig.currentThemeId === theme.id },
          ]"
          @click="applyPresetTheme(theme.id)">
          <div
            class="theme-preview"
            :style="{ background: getThemePreviewColor(theme) }">
            <div class="preview-dots">
              <span :style="{ background: theme.colors.primary.hex }"></span>
              <span :style="{ background: theme.colors.success.hex }"></span>
              <span :style="{ background: theme.colors.warning.hex }"></span>
            </div>
          </div>
          <span class="theme-name">{{ theme.name }}</span>
        </div>
      </div>
    </div>

    <!-- 自定义颜色 -->
    <div class="setting-item">
      <div class="setting-label">
        <span>自定义颜色</span>
        <small>创建您的专属配色方案</small>
      </div>
      <div class="custom-colors-section">
        <div class="color-inputs-grid">
          <div
            v-for="(colorKey, index) in mainColorKeys"
            :key="colorKey"
            class="color-input-item">
            <label>{{ colorLabels[colorKey] }}</label>
            <div class="color-input-wrapper">
              <input
                type="color"
                :value="customColors[colorKey]?.hex || '#000000'"
                @input="updateCustomColor(colorKey, $event.target.value)"
                class="color-picker" />
              <input
                type="text"
                :value="customColors[colorKey]?.hex || '#000000'"
                @input="updateCustomColor(colorKey, $event.target.value)"
                class="color-text-input theme-input"
                placeholder="#000000" />
            </div>
          </div>
        </div>
        <div class="custom-actions">
          <Button
            label="应用自定义主题"
            severity="info"
            @click="applyCustomTheme"
            :disabled="!hasCustomColors" />
          <Button
            label="重置"
            severity="secondary"
            variant="outlined"
            @click="resetCustomColors" />
        </div>
      </div>
    </div>

    <!-- 渐变设置 -->
    <div class="setting-item">
      <div class="setting-label">
        <span>渐变效果</span>
        <small>启用渐变背景和装饰效果</small>
      </div>
      <div class="gradient-section">
        <div class="gradient-toggle">
          <ToggleSwitch
            v-model="currentConfig.enableGradient"
            @change="updateGradientSetting" />
          <span>启用渐变效果</span>
        </div>

        <div v-if="currentConfig.enableGradient" class="gradient-controls">
          <div class="gradient-type-selector">
            <label>渐变类型</label>
            <SelectButton
              v-model="gradientConfig.type"
              :options="gradientTypes"
              option-label="label"
              option-value="value"
              @change="updateGradientConfig" />
          </div>

          <div v-if="gradientConfig.type === 'linear'" class="gradient-angle">
            <label>渐变角度: {{ gradientConfig.angle }}°</label>
            <Slider
              v-model="gradientConfig.angle"
              :min="0"
              :max="360"
              @change="updateGradientConfig" />
          </div>

          <div class="gradient-colors">
            <label>渐变颜色</label>
            <div class="gradient-stops">
              <div
                v-for="(stop, index) in gradientConfig.stops"
                :key="index"
                class="gradient-stop">
                <input
                  type="color"
                  :value="stop.color.hex"
                  @input="
                    updateGradientStop(index, 'color', $event.target.value)
                  "
                  class="color-picker small" />
                <Slider
                  :model-value="stop.position"
                  :min="0"
                  :max="100"
                  @update:model-value="
                    updateGradientStop(index, 'position', $event)
                  "
                  class="position-slider" />
                <span>{{ stop.position }}%</span>
                <Button
                  v-if="gradientConfig.stops.length > 2"
                  icon="pi pi-times"
                  severity="danger"
                  variant="text"
                  size="small"
                  @click="removeGradientStop(index)" />
              </div>
            </div>
            <Button
              v-if="gradientConfig.stops.length < 5"
              label="添加颜色点"
              icon="pi pi-plus"
              severity="secondary"
              variant="outlined"
              size="small"
              @click="addGradientStop" />
          </div>

          <div class="gradient-preview">
            <label>渐变预览</label>
            <div
              class="gradient-preview-box"
              :style="{ background: gradientPreview }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自动切换功能已移除 -->

    <!-- 主题预览 -->
    <div class="setting-item">
      <div class="setting-label">
        <span>主题预览</span>
        <small>预览当前主题效果</small>
      </div>
      <div class="theme-preview-section">
        <div class="preview-container theme-panel-container">
          <div class="preview-header theme-bg-primary">
            <span>主题预览</span>
          </div>
          <div class="preview-content theme-bg">
            <div class="preview-card theme-feature-card">
              <div class="icon-container web-theme">
                <i class="pi pi-globe"></i>
              </div>
              <span class="card-title theme-text">示例卡片</span>
            </div>
            <div class="preview-text">
              <p class="theme-text">主要文字颜色</p>
              <p class="theme-text-secondary">次要文字颜色</p>
              <p class="theme-text-muted">弱化文字颜色</p>
            </div>
            <div class="preview-buttons">
              <Button
                label="主要按钮"
                class="theme-button-primary"
                size="small" />
              <Button
                label="渐变按钮"
                class="theme-button-gradient"
                size="small" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import Button from "primevue/button";
import ToggleSwitch from "primevue/toggleswitch";
import SelectButton from "primevue/selectbutton";
import Slider from "primevue/slider";
import InputText from "primevue/inputtext";
import {
  getCurrentThemeConfig,
  applyTheme,
  presetThemes,
  colorUtils,
  createGradientString,
} from "@/utils/theme";
import { ThemeMode } from "@/interface/theme.d";
import type {
  ThemeConfig,
  ThemeColors,
  GradientConfig,
  ColorValue,
} from "@/interface/theme.d";
import { showMessage } from "@/utils/message";

// 响应式数据
const currentConfig = ref<ThemeConfig>({
  mode: ThemeMode.Light,
  currentThemeId: "default-light",
  enableGradient: false,
});

const customColors = ref<Partial<ThemeColors>>({});
const gradientConfig = ref<GradientConfig>({
  type: "linear",
  angle: 45,
  stops: [
    { color: colorUtils.createColorValue("#4f6df5"), position: 0 },
    { color: colorUtils.createColorValue("#8b5cf6"), position: 100 },
  ],
});

// 常量定义
const themeModes = [
  { label: "浅色", value: ThemeMode.Light },
  { label: "深色", value: ThemeMode.Dark },
  { label: "自定义", value: ThemeMode.Custom },
];

const gradientTypes = [
  { label: "线性", value: "linear" },
  { label: "径向", value: "radial" },
];

const mainColorKeys = [
  "primary",
  "background",
  "text",
  "success",
  "warning",
  "error",
];

const colorLabels: Record<string, string> = {
  primary: "主色调",
  background: "背景色",
  text: "文字色",
  success: "成功色",
  warning: "警告色",
  error: "错误色",
};

// 计算属性
const hasCustomColors = computed(() => {
  return Object.keys(customColors.value).length > 0;
});

const gradientPreview = computed(() => {
  return createGradientString(gradientConfig.value);
});

// 方法
const initializeThemeSettings = async () => {
  try {
    const config = await getCurrentThemeConfig();
    currentConfig.value = { ...config };

    if (config.customColors) {
      customColors.value = { ...config.customColors };
      if (config.customColors.gradient) {
        gradientConfig.value = { ...config.customColors.gradient };
      }
    }
  } catch (error) {
    console.error("初始化主题设置失败:", error);
    showMessage("初始化主题设置失败", 2500, 2);
  }
};

const switchThemeMode = async (mode: ThemeMode) => {
  try {
    if (mode === ThemeMode.Custom) {
      if (!hasCustomColors.value) {
        showMessage("请先设置自定义颜色", 2500, 2);
        return;
      }
      await applyCustomTheme();
    } else {
      const targetTheme = presetThemes.find((t) => t.mode === mode);
      if (targetTheme) {
        await applyTheme(targetTheme.id);
        currentConfig.value.mode = mode;
        currentConfig.value.currentThemeId = targetTheme.id;
      }
    }
    showMessage("主题切换成功", 2500, 1);
  } catch (error) {
    console.error("切换主题模式失败:", error);
    showMessage("切换主题失败", 2500, 2);
  }
};

const applyPresetTheme = async (themeId: string) => {
  try {
    const result = await applyTheme(themeId);
    if (result.success) {
      currentConfig.value.currentThemeId = themeId;
      const theme = presetThemes.find((t) => t.id === themeId);
      if (theme) {
        currentConfig.value.mode = theme.mode;
      }
      showMessage("主题应用成功", 2500, 1);
    }
  } catch (error) {
    console.error("应用预设主题失败:", error);
    showMessage("应用主题失败", 2500, 2);
  }
};

const updateCustomColor = (colorKey: string, colorValue: string) => {
  if (!colorValue.startsWith("#")) {
    colorValue = "#" + colorValue.replace("#", "");
  }

  if (!/^#[0-9A-F]{6}$/i.test(colorValue)) {
    return;
  }

  customColors.value[colorKey as keyof ThemeColors] =
    colorUtils.createColorValue(colorValue);
};

const applyCustomTheme = async () => {
  try {
    if (!hasCustomColors.value) {
      showMessage("请先设置自定义颜色", 2500, 2);
      return;
    }

    // 创建完整的自定义主题颜色配置
    const fullCustomColors: ThemeColors = {
      primary:
        customColors.value.primary || colorUtils.createColorValue("#4f6df5"),
      primaryLight:
        customColors.value.primaryLight ||
        colorUtils.createColorValue("#6b7eff"),
      primaryDark:
        customColors.value.primaryDark ||
        colorUtils.createColorValue("#3b5bdb"),
      background:
        customColors.value.background || colorUtils.createColorValue("#ffffff"),
      backgroundSecondary:
        customColors.value.backgroundSecondary ||
        colorUtils.createColorValue("#f8fafc"),
      backgroundCard:
        customColors.value.backgroundCard ||
        colorUtils.createColorValue("#ffffff"),
      text: customColors.value.text || colorUtils.createColorValue("#1e293b"),
      textSecondary:
        customColors.value.textSecondary ||
        colorUtils.createColorValue("#475569"),
      textMuted:
        customColors.value.textMuted || colorUtils.createColorValue("#64748b"),
      border:
        customColors.value.border || colorUtils.createColorValue("#e2e8f0"),
      borderLight:
        customColors.value.borderLight ||
        colorUtils.createColorValue("#f1f5f9"),
      success:
        customColors.value.success || colorUtils.createColorValue("#10b981"),
      warning:
        customColors.value.warning || colorUtils.createColorValue("#f59e0b"),
      error: customColors.value.error || colorUtils.createColorValue("#ef4444"),
      info: customColors.value.info || colorUtils.createColorValue("#3b82f6"),
    };

    // 如果启用渐变，添加渐变配置
    if (currentConfig.value.enableGradient) {
      fullCustomColors.gradient = { ...gradientConfig.value };
    }

    const result = await applyTheme(undefined, fullCustomColors, false);
    if (result.success) {
      currentConfig.value.mode = ThemeMode.Custom;
      currentConfig.value.currentThemeId = undefined;
      showMessage("自定义主题应用成功", 2500, 1);
    }
  } catch (error) {
    console.error("应用自定义主题失败:", error);
    showMessage("应用自定义主题失败", 2500, 2);
  }
};

const resetCustomColors = () => {
  customColors.value = {};
  gradientConfig.value = {
    type: "linear",
    angle: 45,
    stops: [
      { color: colorUtils.createColorValue("#4f6df5"), position: 0 },
      { color: colorUtils.createColorValue("#8b5cf6"), position: 100 },
    ],
  };
  showMessage("自定义颜色已重置", 2500, 1);
};

const updateGradientSetting = async () => {
  try {
    if (currentConfig.value.mode === ThemeMode.Custom) {
      await applyCustomTheme();
    }
  } catch (error) {
    console.error("更新渐变设置失败:", error);
  }
};

const updateGradientConfig = async () => {
  if (
    currentConfig.value.enableGradient &&
    currentConfig.value.mode === ThemeMode.Custom
  ) {
    await applyCustomTheme();
  }
};

const updateGradientStop = (
  index: number,
  property: "color" | "position",
  value: any,
) => {
  if (property === "color") {
    gradientConfig.value.stops[index].color =
      colorUtils.createColorValue(value);
  } else {
    gradientConfig.value.stops[index].position = value;
  }
  updateGradientConfig();
};

const addGradientStop = () => {
  const newPosition = Math.round(
    (gradientConfig.value.stops[gradientConfig.value.stops.length - 1]
      .position +
      gradientConfig.value.stops[0].position) /
      2,
  );
  gradientConfig.value.stops.push({
    color: colorUtils.createColorValue("#8b5cf6"),
    position: newPosition,
  });
  gradientConfig.value.stops.sort((a, b) => a.position - b.position);
  updateGradientConfig();
};

const removeGradientStop = (index: number) => {
  gradientConfig.value.stops.splice(index, 1);
  updateGradientConfig();
};

// 自动切换功能已移除

const getThemePreviewColor = (theme: any) => {
  if (theme.colors.gradient) {
    return createGradientString(theme.colors.gradient);
  }
  return `linear-gradient(135deg, ${theme.colors.primary.hex}, ${theme.colors.primaryLight.hex})`;
};

// 生命周期
onMounted(() => {
  initializeThemeSettings();
});

// 监听器
watch(
  currentConfig,
  (newConfig) => {
    // 配置变化时自动保存
    // 注意：这里不直接调用saveThemeConfig，而是通过具体的操作函数来保存
  },
  { deep: true },
);
</script>

<style lang="less" scoped>
.theme-settings {
  .setting-item {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--theme-border-light);

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .setting-label {
      margin-bottom: 12px;

      span {
        font-weight: 600;
        color: var(--theme-text);
        display: block;
        margin-bottom: 4px;
      }

      small {
        color: var(--theme-text-muted);
        font-size: 12px;
      }
    }
  }

  .theme-mode-selector {
    display: flex;
    gap: 8px;

    .mode-button {
      flex: 1;
    }
  }

  .preset-themes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;

    .preset-theme-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px;
      border: 2px solid var(--theme-border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--theme-primary);
        box-shadow: var(--theme-shadow-md);
      }

      &.active {
        border-color: var(--theme-primary);
        background: rgba(var(--theme-primary-rgb), 0.05);
      }

      .theme-preview {
        width: 60px;
        height: 40px;
        border-radius: 6px;
        margin-bottom: 8px;
        position: relative;
        overflow: hidden;

        .preview-dots {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 3px;

          span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: block;
          }
        }
      }

      .theme-name {
        font-size: 12px;
        color: var(--theme-text);
        text-align: center;
      }
    }
  }

  .custom-colors-section {
    .color-inputs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 16px;

      .color-input-item {
        label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          color: var(--theme-text-secondary);
        }

        .color-input-wrapper {
          display: flex;
          gap: 8px;
          align-items: center;

          .color-picker {
            width: 40px;
            height: 32px;
            border: 1px solid var(--theme-border);
            border-radius: 4px;
            cursor: pointer;
            padding: 0;
            background: none;

            &::-webkit-color-swatch-wrapper {
              padding: 0;
            }

            &::-webkit-color-swatch {
              border: none;
              border-radius: 3px;
            }

            &.small {
              width: 24px;
              height: 24px;
            }
          }

          .color-text-input {
            flex: 1;
            font-family: "Courier New", monospace;
            font-size: 12px;
          }
        }
      }
    }

    .custom-actions {
      display: flex;
      gap: 12px;
    }
  }

  .gradient-section {
    .gradient-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .gradient-controls {
      padding-left: 16px;
      border-left: 2px solid var(--theme-border-light);

      .gradient-type-selector,
      .gradient-angle,
      .gradient-colors {
        margin-bottom: 16px;

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          color: var(--theme-text-secondary);
        }
      }

      .gradient-stops {
        .gradient-stop {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .position-slider {
            flex: 1;
          }

          span {
            min-width: 35px;
            font-size: 12px;
            color: var(--theme-text-muted);
          }
        }
      }

      .gradient-preview {
        .gradient-preview-box {
          height: 60px;
          border-radius: 8px;
          border: 1px solid var(--theme-border);
        }
      }
    }
  }

  // 自动切换相关样式已移除

  .theme-preview-section {
    .preview-container {
      border-radius: 12px;
      overflow: hidden;

      .preview-header {
        padding: 12px 16px;
        font-weight: 600;
        text-align: center;
      }

      .preview-content {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;

        .preview-card {
          align-self: flex-start;
        }

        .preview-text {
          p {
            margin: 4px 0;
            font-size: 14px;
          }
        }

        .preview-buttons {
          display: flex;
          gap: 8px;
        }
      }
    }
  }
}

// PrimeVue 组件样式已移至全局theme.less中配置
</style>
