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

    <div class="setting-item flex justify-between items-center">
      <div class="setting-label">
        <span>界面显示</span>
        <small>设置应用和网站的显示模式</small>
      </div>
      <Button
        label="显示设置"
        severity="secondary"
        variant="outlined"
        size="small"
        icon="pi pi-cog"
        @click="showDisplayModeDialog = true" />
    </div>

    <!-- 显示模式设置弹窗 -->
    <Dialog
      v-model:visible="showDisplayModeDialog"
      header="界面显示设置"
      modal
      :dismissableMask="true"
      :closable="true"
      :style="{ width: '380px' }">
      <div class="display-mode-dialog">
        <div class="dialog-content">
          <div class="mode-group">
            <div class="group-row">
              <div class="group-label">
                <i class="pi pi-globe"></i>
                <span>网站列表</span>
              </div>
              <Select
                v-model="webDisplayMode"
                :options="displayModeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="选择显示模式"
                @change="handleDisplayModeChange('web', webDisplayMode)"
                size="small"
                class="mode-select" />
            </div>
          </div>

          <div class="mode-group">
            <div class="group-row">
              <div class="group-label">
                <i class="pi pi-desktop"></i>
                <span>应用列表</span>
              </div>
              <Select
                v-model="appDisplayMode"
                :options="displayModeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="选择显示模式"
                @change="handleDisplayModeChange('app', appDisplayMode)"
                size="small"
                class="mode-select" />
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <CustomThemeDialog
      v-model:visible="customThemeDialogVisible"
      :current-theme="currentConfig"
      @apply="handleCustomThemeApply" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Button from "primevue/button";
import Select from "primevue/select";
import Dialog from "primevue/dialog";
import {
  getCurrentThemeConfig,
  applyTheme,
  presetThemes,
  colorUtils,
} from "@/themes/theme";
import { ThemeMode } from "@/types/theme";
import type { ThemeConfig, ThemeColors } from "@/types/theme";
import { showMessage } from "@/composables/message.ts";
import CustomThemeDialog from "./components/CustomThemeDialog.vue";
import { ErrorHandler } from "@/utils/errorHandler";
import { DisplayModeEnum } from "@/types/enum";
import { getConfig, setConfig } from "@/utils/config";
import { emit as tauriEmit } from "@tauri-apps/api/event";

const currentConfig = ref<ThemeConfig>({
  mode: ThemeMode.Light,
  currentThemeId: "default-light",
});

// 显示模式相关
const appDisplayMode = ref(DisplayModeEnum.List);
const webDisplayMode = ref(DisplayModeEnum.List);

// 显示模式选项
const displayModeOptions = [
  { label: "列表视图", value: DisplayModeEnum.List },
  { label: "卡片视图", value: DisplayModeEnum.Card },
];

const customThemeDialogVisible = ref(false);
const showDisplayModeDialog = ref(false);

const themeModes = [
  { label: "浅色", value: ThemeMode.Light },
  { label: "深色", value: ThemeMode.Dark },
  { label: "自定义", value: ThemeMode.Custom },
];

const initializeThemeSettings = async () => {
  try {
    const config = await getCurrentThemeConfig();
    currentConfig.value = { ...config };

    // 初始化显示模式
    const appConfig = await getConfig("appConfig");
    const webConfig = await getConfig("webConfig");

    if (appConfig?.displayMode !== undefined) {
      appDisplayMode.value = appConfig.displayMode;
    } else {
      // 设置默认显示模式
      await setConfig("appConfig", {
        dataList: [],
        displayMode: DisplayModeEnum.List,
      });
    }

    if (webConfig?.displayMode !== undefined) {
      webDisplayMode.value = webConfig.displayMode;
    } else {
      // 设置默认显示模式
      await setConfig("webConfig", {
        dataList: [],
        displayMode: DisplayModeEnum.List,
      });
    }
  } catch (error) {
    ErrorHandler.handleError(error, "初始化主题设置失败:");
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
    ErrorHandler.handleError(error, "切换主题模式失败:");
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
    ErrorHandler.handleError(error, "应用预设主题失败:");
    showMessage("应用主题失败", 2500, 2);
  }
};

const showCustomThemeDialog = async () => {
  await initializeThemeSettings();
  customThemeDialogVisible.value = true;
};

// 处理显示模式变更
const handleDisplayModeChange = async (
  type: "app" | "web",
  mode: DisplayModeEnum,
) => {
  try {
    const configKey = type === "app" ? "appConfig" : "webConfig";
    const currentConfig = await getConfig(configKey);
    await setConfig(configKey, {
      ...currentConfig,
      displayMode: mode,
    });

    // 发送事件通知其他组件显示模式已更改
    tauriEmit(`update:${type}-display-mode`, { displayMode: mode });
  } catch (error) {
    ErrorHandler.handleError(
      error,
      `设置${type === "app" ? "应用" : "网站"}显示模式失败:`,
    );
  }
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
        border: config.transparency.border || 0.3,
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
    ErrorHandler.handleError(error, "应用自定义主题失败:");
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

<style lang="less">
.theme-settings {
  .setting-item {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid
      rgba(var(--theme-border-rgb), var(--theme-transparency-border));

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
      border: 2px solid
        rgba(var(--theme-border-rgb), var(--theme-transparency-border));
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(
        var(--theme-background-rgb),
        var(--theme-transparency-background)
      );
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
          rgba(
            var(--theme-background-rgb),
            var(--theme-transparency-background)
          ),
          transparent
        );
      }

      &:hover {
        border-color: var(--theme-primary);
        box-shadow:
          0 4px 16px rgba(var(--theme-primary-rgb), 0.15),
          0 2px 8px rgba(var(--theme-text-rgb), 0.08);
        transform: translateY(-2px) scale(1.02);
        background: rgba(
          var(--theme-background-rgb),
          var(--theme-transparency-background)
        );
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
          color: var(--theme-background);
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
          inset 0 1px 0
            rgba(var(--theme-background-rgb), var(--theme-transparency-border));
        border: 1px solid
          rgba(var(--theme-border-rgb), var(--theme-transparency-border));

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
            box-shadow: var(--theme-shadow-sm);
            border: 1px solid
              rgba(var(--theme-border-rgb), var(--theme-transparency-border));
          }
        }

        &::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(var(--theme-background-rgb), var(--theme-transparency-border))
              0%,
            transparent 50%,
            rgba(
                var(--theme-border-rgb),
                calc(var(--theme-transparency-border) * 0.3)
              )
              100%
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
.display-mode-dialog {
  padding: 10px;
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .mode-group {
      background: rgba(
        var(--theme-background-card-rgb),
        var(--theme-transparency-card)
      );
      border: 1px solid
        rgba(var(--theme-border-rgb), var(--theme-transparency-border));
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(var(--theme-primary-rgb), 0.3);
      }

      .group-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;

        .group-label {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          i {
            font-size: 16px;
            color: var(--theme-primary);
            width: 20px;
            text-align: center;
          }

          span {
            font-size: 14px;
            font-weight: 600;
            color: var(--theme-text);
          }
        }

        .mode-select {
          width: 140px;
          flex-shrink: 0;
        }
      }
    }
  }
}
</style>
