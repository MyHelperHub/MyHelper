import { computed, onMounted, ref } from "vue";
import {
  getCurrentThemeConfig,
  applyTheme,
  toggleThemeMode,
  presetThemes,
} from "@/utils/theme";
import type { ThemeConfig } from "@/interface/theme.d";

/**
 * 主题组合函数
 * 提供主题相关的响应式状态和方法
 */
export function useTheme() {
  const currentTheme = ref<ThemeConfig | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isDarkMode = computed(() => {
    return currentTheme.value?.mode === "dark";
  });

  const isCustomMode = computed(() => {
    return currentTheme.value?.mode === "custom";
  });

  const currentThemeName = computed(() => {
    if (!currentTheme.value) return "默认浅色";

    if (currentTheme.value.customColors) {
      return "自定义主题";
    }

    const preset = presetThemes.find(
      (t) => t.id === currentTheme.value?.currentThemeId,
    );
    return preset?.name || "默认浅色";
  });

  const availableThemes = computed(() => {
    return presetThemes;
  });

  // 方法
  const loadTheme = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      currentTheme.value = await getCurrentThemeConfig();
    } catch (err) {
      error.value = err instanceof Error ? err.message : "加载主题配置失败";
      console.error("加载主题失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const switchTheme = async (themeId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await applyTheme(themeId);
      if (result.success) {
        await loadTheme(); // 重新加载配置
        return true;
      } else {
        error.value = result.error || "切换主题失败";
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "切换主题失败";
      console.error("切换主题失败:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const toggleMode = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await toggleThemeMode();
      if (result.success) {
        await loadTheme(); // 重新加载配置
        return true;
      } else {
        error.value = result.error || "切换模式失败";
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "切换模式失败";
      console.error("切换模式失败:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const applyCustomTheme = async (customColors: any) => {
    try {
      isLoading.value = true;
      error.value = null;

      const result = await applyTheme(undefined, customColors);
      if (result.success) {
        await loadTheme(); // 重新加载配置
        return true;
      } else {
        error.value = result.error || "应用自定义主题失败";
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "应用自定义主题失败";
      console.error("应用自定义主题失败:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 生命周期
  onMounted(() => {
    loadTheme();
  });

  return {
    // 响应式状态
    currentTheme,
    isLoading,
    error,

    // 计算属性
    isDarkMode,
    isCustomMode,
    currentThemeName,
    availableThemes,

    // 方法
    loadTheme,
    switchTheme,
    toggleMode,
    applyCustomTheme,
  };
}

/**
 * 主题CSS类组合函数
 * 提供主题相关的CSS类名
 */
export function useThemeClasses() {
  const getThemeClass = (baseClass: string, variant?: string) => {
    const classes = [`theme-${baseClass}`];
    if (variant) {
      classes.push(`theme-${baseClass}-${variant}`);
    }
    return classes.join(" ");
  };

  const backgroundClasses = {
    primary: "theme-bg-primary",
    secondary: "theme-bg-secondary",
    card: "theme-bg-card",
    gradient: "theme-bg-gradient",
  };

  const textClasses = {
    primary: "theme-text",
    secondary: "theme-text-secondary",
    muted: "theme-text-muted",
    accent: "theme-text-primary",
  };

  const borderClasses = {
    default: "theme-border",
    light: "theme-border-light",
    primary: "theme-border-primary",
  };

  const componentClasses = {
    card: "theme-feature-card",
    glassCard: "theme-glass-card",
    listCard: "theme-list-card",
    panel: "theme-panel-container",
    input: "theme-input",
    button: "theme-button-primary",
    gradientButton: "theme-button-gradient",
  };

  return {
    getThemeClass,
    backgroundClasses,
    textClasses,
    borderClasses,
    componentClasses,
  };
}
