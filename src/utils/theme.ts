import { getConfig, setConfig } from "./config";
import { useDebounce } from "./common";
import { ThemeMode } from "@/interface/theme.d";
import type {
  ThemeConfig,
  ThemeColors,
  ColorValue,
  PresetTheme,
  ThemeApplyResult,
} from "@/interface/theme.d";
import { emit as tauriEmit } from "@tauri-apps/api/event";

const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: ThemeMode.Light,
  currentThemeId: "default-light",
};

let isUpdatingTheme = false;
export const colorUtils = {
  hexToRgb(hex: string): string {
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
    const result = rgb.match(/\d+/g);
    if (!result) return "";
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  hslToHex(hsl: string): string {
    const result = hsl.match(/\d+/g);
    if (!result) return "";

    const h = parseInt(result[0]) / 360;
    const s = parseInt(result[1]) / 100;
    const l = parseInt(result[2]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  /**
   * 创建颜色值对象
   */
  createColorValue(hex: string): ColorValue {
    return {
      hex,
      rgb: this.hexToRgb(hex),
      hsl: this.hexToHsl(hex),
    };
  },

  /**
   * 调亮颜色
   */
  lighten(hex: string, amount: number): string {
    const color = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * amount);
    const R = (color >> 16) + amt;
    const G = ((color >> 8) & 0x00ff) + amt;
    const B = (color & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  },

  /**
   * 调暗颜色
   */
  darken(hex: string, amount: number): string {
    return this.lighten(hex, -amount);
  },

  /**
   * 生成颜色调色板
   */
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
 * 预设主题
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
      // 添加透明度配置
      transparency: {
        background: 0.92,
        backgroundSecondary: 0.85,
        card: 0.9,
      },
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
      // 添加透明度配置
      transparency: {
        background: 0.88,
        backgroundSecondary: 0.82,
        card: 0.85,
      },
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
      transparency: {
        background: 0.88,
        backgroundSecondary: 0.82,
        card: 0.85,
      },
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
      transparency: {
        background: 0.85,
        backgroundSecondary: 0.78,
        card: 0.82,
      },
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
      transparency: {
        background: 0.95,
        backgroundSecondary: 0.88,
        card: 0.92,
      },
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
      transparency: {
        background: 0.93,
        backgroundSecondary: 0.86,
        card: 0.9,
      },
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
      transparency: {
        background: 0.87,
        backgroundSecondary: 0.8,
        card: 0.84,
      },
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
      transparency: {
        background: 0.96,
        backgroundSecondary: 0.9,
        card: 0.94,
      },
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
      transparency: {
        background: 0.82,
        backgroundSecondary: 0.75,
        card: 0.8,
      },
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
    if (
      key !== "gradient" &&
      key !== "transparency" &&
      typeof value === "object" &&
      "hex" in value
    ) {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      variables[`--theme-${cssKey}`] = value.hex;
      variables[`--theme-${cssKey}-rgb`] = value.rgb
        .replace("rgb(", "")
        .replace(")", "");
      variables[`--theme-${cssKey}-hsl`] = value.hsl
        .replace("hsl(", "")
        .replace(")", "");
    }
  });

  // 透明度变量
  const transparency = colors.transparency || {
    background: 0.9,
    backgroundSecondary: 0.85,
    card: 0.88,
  };

  variables["--theme-transparency-background"] =
    transparency.background.toString();
  variables["--theme-transparency-background-secondary"] =
    transparency.backgroundSecondary.toString();
  variables["--theme-transparency-card"] = transparency.card.toString();

  // 渐变变量
  if (colors.gradient) {
    const { type, angle, stops } = colors.gradient;
    if (type === "linear") {
      const gradientStops = stops
        .map((stop) => `${stop.color.hex} ${stop.position}%`)
        .join(", ");
      variables["--theme-gradient"] =
        `linear-gradient(${angle || 45}deg, ${gradientStops})`;
    } else if (type === "radial") {
      const gradientStops = stops
        .map((stop) => `${stop.color.hex} ${stop.position}%`)
        .join(", ");
      variables["--theme-gradient"] =
        `radial-gradient(circle, ${gradientStops})`;
    }
  }

  return variables;
}

/**
 * 应用主题变量到DOM（优化版本）
 */
function applyThemeVariables(variables: Record<string, string>): void {
  requestAnimationFrame(() => {
    const style = document.createElement("style");
    const cssRules = Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n");

    style.textContent = `:root {\n${cssRules}\n}`;

    // 替换现有的主题样式
    const existingStyle = document.getElementById("dynamic-theme-vars");
    if (existingStyle) {
      existingStyle.remove();
    }

    style.id = "dynamic-theme-vars";
    document.head.appendChild(style);
  });
}

/**
 * 获取当前主题配置
 */
export async function getCurrentThemeConfig(): Promise<ThemeConfig> {
  try {
    const config = await getConfig<ThemeConfig>("themeConfig");
    return config || DEFAULT_THEME_CONFIG;
  } catch (error) {
    console.error("获取主题配置失败:", error);
    return DEFAULT_THEME_CONFIG;
  }
}

/**
 * 保存主题配置（防抖版本）
 */
const debouncedSaveConfig = useDebounce(async (config: ThemeConfig) => {
  if (isUpdatingTheme) return; // 防止递归调用

  try {
    isUpdatingTheme = true;
    await setConfig("themeConfig", config);
    // 通知所有webview更新主题
    await tauriEmit("theme:update", config);
  } catch (error) {
    console.error("保存主题配置失败:", error);
  } finally {
    isUpdatingTheme = false;
  }
}, 300);

/**
 * 保存主题配置
 */
export async function saveThemeConfig(config: ThemeConfig): Promise<void> {
  try {
    // 先同步更新内存中的配置，再异步保存到数据库
    debouncedSaveConfig(config);
  } catch (error) {
    console.error("保存主题配置失败:", error);
    throw error;
  }
}

/**
 * 应用主题（优化版本）
 */
export async function applyTheme(
  themeId?: string,
  customColors?: ThemeColors,
  skipSave = false,
): Promise<ThemeApplyResult> {
  try {
    let colors: ThemeColors;
    let config = await getCurrentThemeConfig();

    if (customColors) {
      // 使用自定义颜色
      colors = customColors;
      config.mode = ThemeMode.Custom;
      config.customColors = customColors;
      config.currentThemeId = undefined;
    } else if (themeId) {
      // 使用预设主题
      const preset = presetThemes.find((t) => t.id === themeId);
      if (!preset) {
        throw new Error(`主题 ${themeId} 不存在`);
      }
      colors = preset.colors;
      config.mode = preset.mode;
      config.currentThemeId = themeId;
      config.customColors = undefined;
    } else {
      // 使用当前配置
      if (config.customColors) {
        colors = config.customColors;
      } else {
        const preset =
          presetThemes.find((t) => t.id === config.currentThemeId) ||
          presetThemes[0];
        colors = preset.colors;
      }
    }

    // 生成并应用CSS变量
    const variables = generateCSSVariables(colors);
    applyThemeVariables(variables);

    // 更新data-theme属性
    document.documentElement.setAttribute(
      "data-theme",
      config.mode === ThemeMode.Dark ? "dark" : "light",
    );

    // 保存配置（除非明确跳过）
    if (!skipSave) {
      await saveThemeConfig(config);
    }

    return {
      success: true,
      appliedColors: colors,
    };
  } catch (error) {
    console.error("应用主题失败:", error);
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
      throw new Error("找不到目标主题模式");
    }
  } catch (error) {
    console.error("切换主题模式失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "切换主题模式失败",
      appliedColors: presetThemes[0].colors,
    };
  }
}

// 自动切换主题功能已移除

/**
 * 初始化主题系统（优化版本）
 */
export async function initTheme(): Promise<void> {
  // 防止重复初始化
  if (isUpdatingTheme) return;

  try {
    isUpdatingTheme = true;

    const config = await getCurrentThemeConfig();

    // 应用当前主题（跳过保存，避免递归）
    if (config.customColors) {
      await applyTheme(undefined, config.customColors, true);
    } else if (config.currentThemeId) {
      await applyTheme(config.currentThemeId, undefined, true);
    } else {
      await applyTheme("default-light", undefined, true);
    }
  } catch (error) {
    console.error("初始化主题失败:", error);
    // 应用默认主题
    await applyTheme("default-light", undefined, true);
  } finally {
    isUpdatingTheme = false;
  }
}
