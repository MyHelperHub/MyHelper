/**
 * PrimeVue 主题集成 - 基于官方最佳实践
 */

import type { ThemeColors } from "@/interface/theme.d";
import { colorUtils } from "../theme";

/**
 * 将主题颜色应用到 PrimeVue --p-* 变量
 * 基于 PrimeVue 官方文档的最佳实践
 */
export function applyPrimeVueTheme(colors: ThemeColors, mode: "light" | "dark"): void {
  const root = document.documentElement;
  const isDark = mode === "dark";

  // 1. 设置主题模式属性 - 官方推荐方式
  root.setAttribute("data-theme", isDark ? "dark" : "light");
  
  // 2. 设置暗色模式类 - 兼容现有配置
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // 3. 生成并应用主色调色板
  const primaryPalette = generatePrimaryPalette(colors.primary.hex);
  Object.entries(primaryPalette).forEach(([key, value]) => {
    root.style.setProperty(`--p-primary-${key}`, value);
  });

  // 4. 应用表面色系 (Surface colors)
  applySurfaceColors(colors, isDark);

  // 5. 应用语义化颜色 (Semantic colors)
  applySemanticColors(colors);

  // 6. 应用其他 PrimeVue 变量
  applyAdditionalPrimeVueVars(colors, isDark);
}

/**
 * 生成主色调色板 (50-950) - 优化版本
 */
function generatePrimaryPalette(baseColor: string): Record<string, string> {
  const palette: Record<string, string> = {};
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  
  // 使用更精确的颜色调整算法
  const adjustments = [-90, -80, -60, -30, -15, 0, 15, 30, 50, 70, 85];

  steps.forEach((step, index) => {
    const adjustment = adjustments[index];
    if (adjustment === 0) {
      palette[step.toString()] = baseColor;
    } else if (adjustment < 0) {
      palette[step.toString()] = colorUtils.lighten(
        baseColor,
        Math.abs(adjustment),
      );
    } else {
      palette[step.toString()] = colorUtils.darken(baseColor, adjustment);
    }
  });

  return palette;
}

/**
 * 应用表面色系 (Surface/Background colors)
 */
function applySurfaceColors(colors: ThemeColors, isDark: boolean): void {
  const root = document.documentElement;
  
  // PrimeVue 表面色变量
  root.style.setProperty('--p-surface-0', colors.background.hex);
  root.style.setProperty('--p-surface-50', colors.backgroundSecondary.hex);
  root.style.setProperty('--p-surface-100', colors.backgroundCard.hex);
  root.style.setProperty('--p-surface-200', colors.borderLight.hex);
  root.style.setProperty('--p-surface-300', colors.border.hex);
  
  // 文本颜色
  root.style.setProperty('--p-text-color', colors.text.hex);
  root.style.setProperty('--p-text-muted-color', colors.textMuted.hex);
  root.style.setProperty('--p-text-secondary-color', colors.textSecondary.hex);
  
  // 内容相关
  root.style.setProperty('--p-content-background', colors.backgroundCard.hex);
  root.style.setProperty('--p-content-hover-background', 
    isDark ? colorUtils.lighten(colors.backgroundCard.hex, 10) : colorUtils.darken(colors.backgroundCard.hex, 5)
  );
  
  // 边框相关
  root.style.setProperty('--p-content-border-color', colors.border.hex);
  root.style.setProperty('--p-border-color', colors.border.hex);
}

/**
 * 应用语义化颜色 (Success, Warning, Error, Info)
 */
function applySemanticColors(colors: ThemeColors): void {
  const root = document.documentElement;
  
  // Success 色系
  const successPalette = generateColorPalette(colors.success.hex);
  Object.entries(successPalette).forEach(([key, value]) => {
    root.style.setProperty(`--p-green-${key}`, value);
  });
  
  // Warning 色系  
  const warningPalette = generateColorPalette(colors.warning.hex);
  Object.entries(warningPalette).forEach(([key, value]) => {
    root.style.setProperty(`--p-orange-${key}`, value);
  });
  
  // Error 色系
  const errorPalette = generateColorPalette(colors.error.hex);
  Object.entries(errorPalette).forEach(([key, value]) => {
    root.style.setProperty(`--p-red-${key}`, value);
  });
  
  // Info 色系
  const infoPalette = generateColorPalette(colors.info.hex);
  Object.entries(infoPalette).forEach(([key, value]) => {
    root.style.setProperty(`--p-blue-${key}`, value);
  });
}

/**
 * 应用其他 PrimeVue 特定变量
 */
function applyAdditionalPrimeVueVars(colors: ThemeColors, isDark: boolean): void {
  const root = document.documentElement;
  
  // Overlay 相关
  root.style.setProperty('--p-overlay-background', 
    `rgba(${colors.text.rgb.replace(/rgb\(|\)/g, '')}, 0.4)`
  );
  
  // Focus Ring
  root.style.setProperty('--p-focus-ring-color', 
    `rgba(${colors.primary.rgb.replace(/rgb\(|\)/g, '')}, 0.2)`
  );
  
  // Mask
  root.style.setProperty('--p-mask-background', 
    `rgba(${colors.text.rgb.replace(/rgb\(|\)/g, '')}, 0.4)`
  );
  
  // Highlight
  root.style.setProperty('--p-highlight-background', 
    isDark ? colorUtils.lighten(colors.primary.hex, 20) : colorUtils.lighten(colors.primary.hex, 40)
  );
  root.style.setProperty('--p-highlight-color', 
    isDark ? colors.background.hex : colors.text.hex
  );
}

/**
 * 生成颜色调色板 (通用函数)
 */
function generateColorPalette(baseColor: string): Record<string, string> {
  const palette: Record<string, string> = {};
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const adjustments = [-85, -75, -55, -25, -10, 0, 10, 25, 45, 65, 80];

  steps.forEach((step, index) => {
    const adjustment = adjustments[index];
    if (adjustment === 0) {
      palette[step.toString()] = baseColor;
    } else if (adjustment < 0) {
      palette[step.toString()] = colorUtils.lighten(
        baseColor,
        Math.abs(adjustment),
      );
    } else {
      palette[step.toString()] = colorUtils.darken(baseColor, adjustment);
    }
  });

  return palette;
}