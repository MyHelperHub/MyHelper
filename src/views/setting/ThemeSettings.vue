<template>
  <div class="theme-settings">
    <h4>主题设置</h4>

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

    <CustomThemeDialog
      v-model:visible="customThemeDialogVisible"
      :current-theme="currentConfig"
      @apply="handleCustomThemeApply" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Button from "primevue/button";
import {
  getCurrentThemeConfig,
  applyTheme,
  presetThemes,
  colorUtils,
} from "@/themes/theme";
import { ThemeMode } from "@/interface/theme.d";
import type { ThemeConfig, ThemeColors } from "@/interface/theme.d";
import { showMessage } from "@/composables/message.ts";
import CustomThemeDialog from "@/components/CustomThemeDialog.vue";

const currentConfig = ref<ThemeConfig>({
  mode: ThemeMode.Light,
  currentThemeId: "default-light",
});

const customThemeDialogVisible = ref(false);

const themeModes = [
  { label: "浅色", value: ThemeMode.Light },
  { label: "深色", value: ThemeMode.Dark },
  { label: "自定义", value: ThemeMode.Custom },
];

const initializeThemeSettings = async () => {
  try {
    const config = await getCurrentThemeConfig();
    currentConfig.value = { ...config };
  } catch (error) {
    console.error("初始化主题设置失败:", error);
    showMessage("初始化主题设置失败", 2500, 2);
  }
};

const switchThemeMode = async (mode: ThemeMode) => {
  try {
    if (mode === ThemeMode.Custom) {
      showCustomThemeDialog();
    } else {
      const themeId =
        mode === ThemeMode.Light ? "default-light" : "default-dark";
      await applyTheme(themeId);
      currentConfig.value.mode = mode;
      currentConfig.value.currentThemeId = themeId;
      showMessage("主题切换成功", 2500, 1);
    }
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

const showCustomThemeDialog = async () => {
  await initializeThemeSettings();
  customThemeDialogVisible.value = true;
};

const handleCustomThemeApply = async (config: any) => {
  try {
    const fullCustomColors: ThemeColors = {
      primary: colorUtils.createColorValue(config.colors.primary),
      primaryLight: colorUtils.createColorValue(
        colorUtils.lighten(config.colors.primary, 10),
      ),
      primaryDark: colorUtils.createColorValue(
        colorUtils.darken(config.colors.primary, 10),
      ),
      background: colorUtils.createColorValue(config.colors.background),
      backgroundSecondary: colorUtils.createColorValue(
        config.colors.backgroundSecondary,
      ),
      backgroundCard: colorUtils.createColorValue(config.colors.background),
      text: colorUtils.createColorValue(config.colors.text),
      textSecondary: colorUtils.createColorValue(config.colors.textSecondary),
      textMuted: colorUtils.createColorValue(
        colorUtils.lighten(config.colors.textSecondary, 15),
      ),
      border: colorUtils.createColorValue(
        colorUtils.darken(config.colors.backgroundSecondary, 5),
      ),
      borderLight: colorUtils.createColorValue(
        colorUtils.lighten(config.colors.backgroundSecondary, 5),
      ),
      success: colorUtils.createColorValue(config.colors.success),
      warning: colorUtils.createColorValue(config.colors.warning),
      error: colorUtils.createColorValue(config.colors.error),
      info: colorUtils.createColorValue(config.colors.primary),
      transparency: {
        background: config.transparency.background,
        backgroundSecondary: config.transparency.backgroundSecondary,
        card: config.transparency.card,
      },
    };

    const result = await applyTheme(undefined, fullCustomColors, false);
    if (result.success) {
      currentConfig.value.mode = ThemeMode.Custom;
      currentConfig.value.currentThemeId = undefined;
      currentConfig.value.customColors = fullCustomColors;
      showMessage("自定义主题应用成功", 2500, 1);
    }
  } catch (error) {
    console.error("应用自定义主题失败:", error);
    showMessage("应用自定义主题失败", 2500, 2);
  }
};

const getThemePreviewColor = (theme: any) => {
  if (theme.colors.gradient) {
    return `linear-gradient(${theme.colors.gradient.angle}deg, ${theme.colors.gradient.stops.map((s: any) => `${s.color.hex} ${s.position}%`).join(", ")})`;
  }
  return `linear-gradient(135deg, ${theme.colors.primary.hex}, ${theme.colors.primaryLight.hex})`;
};

onMounted(() => {
  initializeThemeSettings();
});
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
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
    padding: 0 8px 16px 0;
    margin-right: -8px;

    .preset-theme-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 12px;
      border: 2px solid var(--theme-border);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(var(--theme-background-card-rgb), 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      position: relative;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(var(--theme-background-rgb), 0.5),
          transparent
        );
      }

      &:hover {
        border-color: var(--theme-primary);
        box-shadow:
          0 4px 16px rgba(var(--theme-primary-rgb), 0.15),
          0 2px 8px rgba(var(--theme-text-rgb), 0.08);
        transform: translateY(-2px) scale(1.02);
        background: rgba(var(--theme-background-card-rgb), 0.8);
      }

      &.active {
        border-color: var(--theme-primary);
        background: rgba(var(--theme-primary-rgb), 0.08);
        box-shadow:
          0 4px 16px rgba(var(--theme-primary-rgb), 0.2),
          inset 0 1px 0 rgba(var(--theme-primary-rgb), 0.1);

        &::after {
          content: "✓";
          position: absolute;
          top: 8px;
          right: 8px;
          width: 16px;
          height: 16px;
          background: var(--theme-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
          line-height: 1;
          box-shadow: 0 2px 4px rgba(var(--theme-primary-rgb), 0.3);
        }
      }

      .theme-preview {
        width: 80px;
        height: 50px;
        border-radius: 10px;
        margin-bottom: 12px;
        position: relative;
        overflow: hidden;
        box-shadow:
          0 2px 8px rgba(var(--theme-text-rgb), 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(var(--theme-border-rgb), 0.3);

        .preview-dots {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 4px;

          span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: block;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
        }

        &::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.05) 100%
          );
          pointer-events: none;
        }
      }

      .theme-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--theme-text);
        text-align: center;
        letter-spacing: 0.3px;
        text-shadow: 0 1px 2px rgba(var(--theme-text-rgb), 0.1);
      }
    }
  }
}
</style>
