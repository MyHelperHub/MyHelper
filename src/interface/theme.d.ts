/**
 * 主题模式枚举
 */
export enum ThemeMode {
  Light = "light",
  Dark = "dark",
  Custom = "custom",
}

/**
 * 颜色格式类型
 */
export type ColorFormat = "hex" | "rgb" | "hsl";

/**
 * 颜色值接口
 */
export interface ColorValue {
  hex: string;
  rgb: string;
  hsl: string;
}

/**
 * 渐变配置接口
 */
export interface GradientConfig {
  type: "linear" | "radial";
  angle?: number; // 线性渐变角度
  stops: Array<{
    color: ColorValue;
    position: number; // 0-100
  }>;
}

/**
 * 透明度配置接口
 */
export interface TransparencyConfig {
  background: number; // 主背景透明度 0.1-1
  backgroundSecondary: number; // 次要背景透明度 0.1-1
  card: number; // 卡片透明度 0.1-1
}

/**
 * 主题颜色配置接口
 */
export interface ThemeColors {
  // 主要颜色
  primary: ColorValue;
  primaryLight: ColorValue;
  primaryDark: ColorValue;

  // 背景颜色
  background: ColorValue;
  backgroundSecondary: ColorValue;
  backgroundCard: ColorValue;

  // 文字颜色
  text: ColorValue;
  textSecondary: ColorValue;
  textMuted: ColorValue;

  // 边框颜色
  border: ColorValue;
  borderLight: ColorValue;

  // 功能性颜色
  success: ColorValue;
  warning: ColorValue;
  error: ColorValue;
  info: ColorValue;

  // 渐变配置（可选）
  gradient?: GradientConfig;

  // 透明度配置（可选）
  transparency?: TransparencyConfig;
}

/**
 * 预设主题配置
 */
export interface PresetTheme {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
  preview?: string; // 预览图片URL
}

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  mode: ThemeMode;
  currentThemeId?: string;
  customColors?: ThemeColors;
}

/**
 * 主题应用结果
 */
export interface ThemeApplyResult {
  success: boolean;
  error?: string;
  appliedColors: ThemeColors;
}

/**
 * 颜色工具函数返回类型
 */
export interface ColorUtils {
  hexToRgb: (hex: string) => string;
  hexToHsl: (hex: string) => string;
  rgbToHex: (rgb: string) => string;
  hslToHex: (hsl: string) => string;
  lighten: (color: string, amount: number) => string;
  darken: (color: string, amount: number) => string;
  generatePalette: (baseColor: string) => ColorValue[];
}
