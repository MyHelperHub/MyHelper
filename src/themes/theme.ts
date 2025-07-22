import { getConfig, setConfig } from "../utils/config";
import { useDebounce } from "../utils/common";
import { ThemeMode } from "@/interface/theme.d";
import type {
  ThemeConfig,
  ThemeColors,
  ColorValue,
  PresetTheme,
  ThemeApplyResult,
} from "@/interface/theme.d";
import { emit as tauriEmit } from "@tauri-apps/api/event";
import { ErrorHandler } from "../utils/errorHandler";

// PrimeVue 主题集成
import { applyPrimeVueTheme } from "./primevue";

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: ThemeMode.Light,
  currentThemeId: "default-light",
};

let isUpdatingTheme = false;
let cachedStyleElement: HTMLStyleElement | null = null;
let lastAppliedVariables: string = "";

const DEFAULT_TRANSPARENCY = {
  light: { background: 0.92, backgroundSecondary: 0.85, card: 0.9 },
  dark: { background: 0.88, backgroundSecondary: 0.82, card: 0.85 },
  custom: { background: 0.88, backgroundSecondary: 0.82, card: 0.85 },
};

export const colorUtils = {
  hexToRgb(hex: string): string {
    const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "";

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  },

  hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "";

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  },

  rgbToHex(rgb: string): string {
    const match = rgb.match(/\d+/g);
    if (!match) return "";
    return `#${match
      .slice(0, 3)
      .map((x) => (+x).toString(16).padStart(2, "0"))
      .join("")}`;
  },

  adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  },

  lighten(hex: string, amount: number): string {
    return this.adjustBrightness(hex, amount);
  },

  darken(hex: string, amount: number): string {
    return this.adjustBrightness(hex, -amount);
  },

  createColorValue(hex: string): ColorValue {
    return {
      hex,
      rgb: this.hexToRgb(hex),
      hsl: this.hexToHsl(hex),
    };
  },

  generatePalette(baseColor: string): ColorValue[] {
    const palette: ColorValue[] = [];
    for (let i = -40; i <= 40; i += 10) {
      const color =
        i < 0
          ? this.darken(baseColor, Math.abs(i))
          : this.lighten(baseColor, i);
      palette.push(this.createColorValue(color));
    }
    return palette;
  },
};

/**
 * 预设主题配置
 */
export const presetThemes: PresetTheme[] = [
  {
    id: "default-light",
    name: "默认浅色",
    mode: ThemeMode.Light,
    colors: {
      primary: colorUtils.createColorValue("#4f6df5"),
      primaryLight: colorUtils.createColorValue("#6b7eff"),
      primaryDark: colorUtils.createColorValue("#3b5bdb"),
      background: colorUtils.createColorValue("#ffffff"),
      backgroundSecondary: colorUtils.createColorValue("#f8fafc"),
      backgroundCard: colorUtils.createColorValue("#ffffff"),
      text: colorUtils.createColorValue("#1e293b"),
      textSecondary: colorUtils.createColorValue("#475569"),
      textMuted: colorUtils.createColorValue("#64748b"),
      border: colorUtils.createColorValue("#e2e8f0"),
      borderLight: colorUtils.createColorValue("#f1f5f9"),
      success: colorUtils.createColorValue("#10b981"),
      warning: colorUtils.createColorValue("#f59e0b"),
      error: colorUtils.createColorValue("#ef4444"),
      info: colorUtils.createColorValue("#3b82f6"),
      transparency: DEFAULT_TRANSPARENCY.light,
    },
  },
  {
    id: "default-dark",
    name: "默认深色",
    mode: ThemeMode.Dark,
    colors: {
      primary: colorUtils.createColorValue("#6366f1"),
      primaryLight: colorUtils.createColorValue("#818cf8"),
      primaryDark: colorUtils.createColorValue("#4f46e5"),
      background: colorUtils.createColorValue("#0f172a"),
      backgroundSecondary: colorUtils.createColorValue("#1e293b"),
      backgroundCard: colorUtils.createColorValue("#334155"),
      text: colorUtils.createColorValue("#f8fafc"),
      textSecondary: colorUtils.createColorValue("#cbd5e1"),
      textMuted: colorUtils.createColorValue("#94a3b8"),
      border: colorUtils.createColorValue("#334155"),
      borderLight: colorUtils.createColorValue("#475569"),
      success: colorUtils.createColorValue("#059669"),
      warning: colorUtils.createColorValue("#d97706"),
      error: colorUtils.createColorValue("#dc2626"),
      info: colorUtils.createColorValue("#2563eb"),
      transparency: DEFAULT_TRANSPARENCY.dark,
    },
  },
  {
    id: "blue-gradient",
    name: "蓝色渐变",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#1e40af"),
      primaryLight: colorUtils.createColorValue("#3b82f6"),
      primaryDark: colorUtils.createColorValue("#1e3a8a"),
      background: colorUtils.createColorValue("#eff6ff"),
      backgroundSecondary: colorUtils.createColorValue("#dbeafe"),
      backgroundCard: colorUtils.createColorValue("#f0f9ff"),
      text: colorUtils.createColorValue("#1e3a8a"),
      textSecondary: colorUtils.createColorValue("#1e40af"),
      textMuted: colorUtils.createColorValue("#3b82f6"),
      border: colorUtils.createColorValue("#bfdbfe"),
      borderLight: colorUtils.createColorValue("#dbeafe"),
      success: colorUtils.createColorValue("#059669"),
      warning: colorUtils.createColorValue("#d97706"),
      error: colorUtils.createColorValue("#dc2626"),
      info: colorUtils.createColorValue("#0284c7"),
      transparency: DEFAULT_TRANSPARENCY.custom,
      gradient: {
        type: "linear",
        angle: 135,
        stops: [
          { color: colorUtils.createColorValue("#1e40af"), position: 0 },
          { color: colorUtils.createColorValue("#3b82f6"), position: 50 },
          { color: colorUtils.createColorValue("#6366f1"), position: 100 },
        ],
      },
    },
  },
  {
    id: "purple-gradient",
    name: "紫色渐变",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#8b5cf6"),
      primaryLight: colorUtils.createColorValue("#a78bfa"),
      primaryDark: colorUtils.createColorValue("#7c3aed"),
      background: colorUtils.createColorValue("#ffffff"),
      backgroundSecondary: colorUtils.createColorValue("#faf5ff"),
      backgroundCard: colorUtils.createColorValue("#ffffff"),
      text: colorUtils.createColorValue("#1e293b"),
      textSecondary: colorUtils.createColorValue("#475569"),
      textMuted: colorUtils.createColorValue("#64748b"),
      border: colorUtils.createColorValue("#e2e8f0"),
      borderLight: colorUtils.createColorValue("#f1f5f9"),
      success: colorUtils.createColorValue("#10b981"),
      warning: colorUtils.createColorValue("#f59e0b"),
      error: colorUtils.createColorValue("#ef4444"),
      info: colorUtils.createColorValue("#3b82f6"),
      transparency: DEFAULT_TRANSPARENCY.custom,
      gradient: {
        type: "linear",
        angle: 135,
        stops: [
          { color: colorUtils.createColorValue("#8b5cf6"), position: 0 },
          { color: colorUtils.createColorValue("#ec4899"), position: 100 },
        ],
      },
    },
  },
  {
    id: "tech-blue",
    name: "科技蓝",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#00d4ff"),
      primaryLight: colorUtils.createColorValue("#33ddff"),
      primaryDark: colorUtils.createColorValue("#00a8cc"),
      background: colorUtils.createColorValue("#050912"),
      backgroundSecondary: colorUtils.createColorValue("#0f1829"),
      backgroundCard: colorUtils.createColorValue("#1a2332"),
      text: colorUtils.createColorValue("#e6f3ff"),
      textSecondary: colorUtils.createColorValue("#b3d9f2"),
      textMuted: colorUtils.createColorValue("#8fb8d6"),
      border: colorUtils.createColorValue("#1e2832"),
      borderLight: colorUtils.createColorValue("#2a3441"),
      success: colorUtils.createColorValue("#00ffa3"),
      warning: colorUtils.createColorValue("#ff8c00"),
      error: colorUtils.createColorValue("#ff4757"),
      info: colorUtils.createColorValue("#74b9ff"),
      transparency: { background: 0.85, backgroundSecondary: 0.78, card: 0.82 },
    },
  },
  {
    id: "nature-green",
    name: "自然绿",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#10b981"),
      primaryLight: colorUtils.createColorValue("#34d399"),
      primaryDark: colorUtils.createColorValue("#059669"),
      background: colorUtils.createColorValue("#f0f9f4"),
      backgroundSecondary: colorUtils.createColorValue("#e6f7ed"),
      backgroundCard: colorUtils.createColorValue("#ffffff"),
      text: colorUtils.createColorValue("#064e3b"),
      textSecondary: colorUtils.createColorValue("#047857"),
      textMuted: colorUtils.createColorValue("#065f46"),
      border: colorUtils.createColorValue("#d1fae5"),
      borderLight: colorUtils.createColorValue("#ecfdf5"),
      success: colorUtils.createColorValue("#22c55e"),
      warning: colorUtils.createColorValue("#f59e0b"),
      error: colorUtils.createColorValue("#ef4444"),
      info: colorUtils.createColorValue("#06b6d4"),
      transparency: { background: 0.95, backgroundSecondary: 0.88, card: 0.92 },
    },
  },
  {
    id: "sunset-orange",
    name: "夕阳橙",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#f97316"),
      primaryLight: colorUtils.createColorValue("#fb923c"),
      primaryDark: colorUtils.createColorValue("#ea580c"),
      background: colorUtils.createColorValue("#fef7ed"),
      backgroundSecondary: colorUtils.createColorValue("#fed7aa"),
      backgroundCard: colorUtils.createColorValue("#ffffff"),
      text: colorUtils.createColorValue("#9a3412"),
      textSecondary: colorUtils.createColorValue("#c2410c"),
      textMuted: colorUtils.createColorValue("#ea580c"),
      border: colorUtils.createColorValue("#fed7aa"),
      borderLight: colorUtils.createColorValue("#ffedd5"),
      success: colorUtils.createColorValue("#22c55e"),
      warning: colorUtils.createColorValue("#eab308"),
      error: colorUtils.createColorValue("#ef4444"),
      info: colorUtils.createColorValue("#3b82f6"),
      transparency: { background: 0.93, backgroundSecondary: 0.86, card: 0.9 },
    },
  },
  {
    id: "purple-dream",
    name: "紫色梦幻",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#a855f7"),
      primaryLight: colorUtils.createColorValue("#c084fc"),
      primaryDark: colorUtils.createColorValue("#9333ea"),
      background: colorUtils.createColorValue("#0f0a1e"),
      backgroundSecondary: colorUtils.createColorValue("#1e1533"),
      backgroundCard: colorUtils.createColorValue("#2d2348"),
      text: colorUtils.createColorValue("#f8f7ff"),
      textSecondary: colorUtils.createColorValue("#d4d1f0"),
      textMuted: colorUtils.createColorValue("#b8b5d1"),
      border: colorUtils.createColorValue("#3b1f6b"),
      borderLight: colorUtils.createColorValue("#4c2a7d"),
      success: colorUtils.createColorValue("#10b981"),
      warning: colorUtils.createColorValue("#f59e0b"),
      error: colorUtils.createColorValue("#f43f5e"),
      info: colorUtils.createColorValue("#06b6d4"),
      transparency: { background: 0.87, backgroundSecondary: 0.8, card: 0.84 },
    },
  },
  {
    id: "minimal-mono",
    name: "极简黑白",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#374151"),
      primaryLight: colorUtils.createColorValue("#6b7280"),
      primaryDark: colorUtils.createColorValue("#111827"),
      background: colorUtils.createColorValue("#fafafa"),
      backgroundSecondary: colorUtils.createColorValue("#f5f5f5"),
      backgroundCard: colorUtils.createColorValue("#ffffff"),
      text: colorUtils.createColorValue("#111827"),
      textSecondary: colorUtils.createColorValue("#374151"),
      textMuted: colorUtils.createColorValue("#6b7280"),
      border: colorUtils.createColorValue("#e5e7eb"),
      borderLight: colorUtils.createColorValue("#f3f4f6"),
      success: colorUtils.createColorValue("#059669"),
      warning: colorUtils.createColorValue("#d97706"),
      error: colorUtils.createColorValue("#dc2626"),
      info: colorUtils.createColorValue("#0284c7"),
      transparency: { background: 0.96, backgroundSecondary: 0.9, card: 0.94 },
    },
  },
  {
    id: "cyberpunk",
    name: "赛博朋克",
    mode: ThemeMode.Custom,
    colors: {
      primary: colorUtils.createColorValue("#ff0080"),
      primaryLight: colorUtils.createColorValue("#ff3399"),
      primaryDark: colorUtils.createColorValue("#cc0066"),
      background: colorUtils.createColorValue("#0a0014"),
      backgroundSecondary: colorUtils.createColorValue("#1a002b"),
      backgroundCard: colorUtils.createColorValue("#2d0042"),
      text: colorUtils.createColorValue("#ff00ff"),
      textSecondary: colorUtils.createColorValue("#cc00cc"),
      textMuted: colorUtils.createColorValue("#990099"),
      border: colorUtils.createColorValue("#660099"),
      borderLight: colorUtils.createColorValue("#8800cc"),
      success: colorUtils.createColorValue("#00ff88"),
      warning: colorUtils.createColorValue("#ffaa00"),
      error: colorUtils.createColorValue("#ff0044"),
      info: colorUtils.createColorValue("#0088ff"),
      transparency: { background: 0.82, backgroundSecondary: 0.75, card: 0.8 },
    },
  },
];

/**
 * 生成CSS变量
 */
function generateCSSVariables(colors: ThemeColors): Record<string, string> {
  const variables: Record<string, string> = {};

  // 基础颜色变量
  Object.entries(colors).forEach(([key, value]) => {
    if (key === "transparency" || key === "gradient") return;

    if (value && typeof value === "object" && "hex" in value) {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      variables[`--theme-${cssKey}`] = value.hex;
      variables[`--theme-${cssKey}-rgb`] = value.rgb.replace(/rgb\(|\)/g, "");
    }
  });

  // 透明度变量
  const transparency = colors.transparency || DEFAULT_TRANSPARENCY.custom;
  variables["--theme-transparency-background"] = transparency.background.toString();
  variables["--theme-transparency-background-secondary"] = transparency.backgroundSecondary.toString();
  variables["--theme-transparency-card"] = transparency.card.toString();

  // 渐变变量
  if (colors.gradient) {
    const { type, angle, stops } = colors.gradient;
    const gradientStops = stops
      .map((stop) => `${stop.color.hex} ${stop.position}%`)
      .join(", ");

    if (type === "linear") {
      variables["--theme-gradient"] = `linear-gradient(${angle || 45}deg, ${gradientStops})`;
    } else if (type === "radial") {
      variables["--theme-gradient"] = `radial-gradient(circle, ${gradientStops})`;
    }
  }

  return variables;
}

/**
 * 应用主题变量
 */
function applyThemeVariables(variables: Record<string, string>): void {
  const cssRules = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  const cssContent = `:root {\n${cssRules}\n}`;

  if (lastAppliedVariables === cssContent) return;

  requestAnimationFrame(() => {
    if (!cachedStyleElement) {
      cachedStyleElement = document.createElement("style");
      cachedStyleElement.id = "dynamic-theme-vars";
      document.head.appendChild(cachedStyleElement);
    }

    cachedStyleElement.textContent = cssContent;
    lastAppliedVariables = cssContent;
  });
}

/**
 * 获取当前主题配置
 * @param passedConfig 可选的主题配置，如果提供则使用，否则从数据库获取
 */
export async function getCurrentThemeConfig(passedConfig?: ThemeConfig): Promise<ThemeConfig> {
  try {
    // 优先使用传入的配置，避免重复数据库查询
    if (passedConfig) {
      return passedConfig;
    }
    
    const config = await getConfig<ThemeConfig>("themeConfig");
    return config || DEFAULT_THEME_CONFIG;
  } catch (error) {
    await ErrorHandler.handleError(error, "获取主题配置");
    return DEFAULT_THEME_CONFIG;
  }
}

const debouncedSaveConfig = useDebounce(async (config: ThemeConfig) => {
  if (isUpdatingTheme) return;

  try {
    isUpdatingTheme = true;
    await setConfig("themeConfig", config);
    await tauriEmit("theme:update", config);
  } catch (error) {
    await ErrorHandler.handleError(error, "保存主题配置");
  } finally {
    isUpdatingTheme = false;
  }
}, 300);

/**
 * 保存主题配置
 */
export async function saveThemeConfig(config: ThemeConfig): Promise<void> {
  try {
    debouncedSaveConfig(config);
  } catch (error) {
    await ErrorHandler.handleError(error, "保存主题配置");
  }
}

/**
 * 应用主题
 * @param themeId 主题ID
 * @param customColors 自定义颜色
 * @param skipSave 是否跳过保存
 * @param passedConfig 可选的主题配置，如果提供则使用，否则从数据库获取
 */
export async function applyTheme(
  themeId?: string,
  customColors?: ThemeColors,
  skipSave = false,
  passedConfig?: ThemeConfig,
): Promise<ThemeApplyResult> {
  try {
    let colors: ThemeColors;
    let config = await getCurrentThemeConfig(passedConfig);

    if (customColors) {
      colors = customColors;
      config.mode = ThemeMode.Custom;
      config.customColors = customColors;
      config.currentThemeId = undefined;
    } else if (themeId) {
      const preset = presetThemes.find((t) => t.id === themeId);
      if (!preset) {
        await ErrorHandler.handleError(`主题 ${themeId} 不存在`, "应用主题");
        return {
          success: false,
          error: `主题 ${themeId} 不存在`,
          appliedColors: presetThemes[0].colors,
        };
      }
      colors = preset.colors;
      config.mode = preset.mode;
      config.currentThemeId = themeId;
      config.customColors = undefined;
    } else {
      if (config.customColors) {
        colors = config.customColors;
      } else {
        const preset =
          presetThemes.find((t) => t.id === config.currentThemeId) ||
          presetThemes[0];
        colors = preset.colors;
      }
    }

    // 应用传统 CSS 变量（保持向后兼容）
    const variables = generateCSSVariables(colors);
    applyThemeVariables(variables);

    // 应用 PrimeVue 主题
    try {
      applyPrimeVueTheme(colors, config.mode);
    } catch (primeVueError) {
      // PrimeVue 主题应用失败不应该阻止整个主题系统
      console.warn("PrimeVue 主题应用失败:", primeVueError);
    }

    const isDark = config.mode === ThemeMode.Dark;
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (!skipSave) {
      await saveThemeConfig(config);
    }

    return { success: true, appliedColors: colors };
  } catch (error) {
    await ErrorHandler.handleError(error, "应用主题");
    return {
      success: false,
      error: error instanceof Error ? error.message : "应用主题失败",
      appliedColors: presetThemes[0].colors,
    };
  }
}

/**
 * 切换亮色/暗色模式
 */
export async function toggleThemeMode(): Promise<ThemeApplyResult> {
  try {
    const config = await getCurrentThemeConfig();
    const targetMode =
      config.mode === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;
    const targetTheme = presetThemes.find((t) => t.mode === targetMode);

    if (targetTheme) {
      return await applyTheme(targetTheme.id);
    } else {
      await ErrorHandler.handleError("找不到目标主题模式", "切换主题模式");
      return {
        success: false,
        error: "找不到目标主题模式",
        appliedColors: presetThemes[0].colors,
      };
    }
  } catch (error) {
    await ErrorHandler.handleError(error, "切换主题模式");
    return {
      success: false,
      error: error instanceof Error ? error.message : "切换主题模式失败",
      appliedColors: presetThemes[0].colors,
    };
  }
}

/**
 * 初始化主题系统
 * @param themeConfig 可选的主题配置，如果提供则使用，否则从数据库获取
 */
export async function initTheme(themeConfig?: ThemeConfig): Promise<void> {
  if (isUpdatingTheme) return;

  try {
    isUpdatingTheme = true;
    const config = themeConfig || await getCurrentThemeConfig();

    if (config.customColors) {
      await applyTheme(undefined, config.customColors, true, config);
    } else if (config.currentThemeId) {
      await applyTheme(config.currentThemeId, undefined, true, config);
    } else {
      await applyTheme("default-light", undefined, true, config);
    }
  } catch (error) {
    await ErrorHandler.handleError(error, "主题初始化");

    try {
      // 降级时使用默认配置，不传递config避免循环
      await applyTheme("default-light", undefined, true);
    } catch (fallbackError) {
      await ErrorHandler.handleError(fallbackError, "默认主题降级失败");
    }
  } finally {
    isUpdatingTheme = false;
  }
}

/**
 * 设置主题更新事件监听器
 */
export async function setupThemeListener(): Promise<void> {
  try {
    const { listen } = await import("@tauri-apps/api/event");

    await listen("theme:update", async (event) => {
      const config = event.payload as any;

      if (config.customColors) {
        await applyTheme(undefined, config.customColors, true);
      } else if (config.currentThemeId) {
        await applyTheme(config.currentThemeId, undefined, true);
      }
    });
  } catch (error) {
    await ErrorHandler.handleError(error, "主题事件监听器设置");
  }
}
