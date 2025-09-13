/**
 * PrimeVue 主题集成 - 基于官方最佳实践
 */

import type { ThemeColors } from "@/interface/theme.d";
import { colorUtils } from "../theme";

/**
 * 将主题颜色应用到 PrimeVue --p-* 变量
 */
export function applyPrimeVueTheme(
  colors: ThemeColors,
  mode: "light" | "dark",
): void {
  const root = document.documentElement;
  const isDark = mode === "dark";

  // 1. 设置主题模式属性 - 官方推荐方式
  root.setAttribute("data-theme", isDark ? "dark" : "light");

  // 2. 设置暗色模式类 - 让PrimeVue自动处理暗色模式
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // 3. 只映射我们自定义的主色调色板，其他交给PrimeVue
  const primaryPalette = generatePrimaryPalette(colors.primary.hex);
  Object.entries(primaryPalette).forEach(([key, value]) => {
    root.style.setProperty(`--p-primary-${key}`, value);
  });

  // 4. 映射语义化颜色，但不覆盖PrimeVue的表面色和文本色
  applySemanticColors(colors);

  // 5. 应用透明度系统 - 对接主题透明度配置
  applyTransparencySystem(colors);
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
 * 应用透明度系统 - 对接主题透明度配置到PrimeVue表面色
 */
function applyTransparencySystem(_colors: ThemeColors): void {
  const root = document.documentElement;

  // 这个函数现在主要用于PrimeVue特定的集成
  // 所有的--theme-*变量已经由传统的generateCSSVariables函数生成

  // 添加阴影变量（基于主题模式）
  const isDark = document.documentElement.classList.contains("dark");

  if (isDark) {
    // 暗色主题阴影
    root.style.setProperty(
      "--theme-shadow-sm",
      "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    );
    root.style.setProperty(
      "--theme-shadow-md",
      "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    );
    root.style.setProperty(
      "--theme-shadow-lg",
      "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
    );
  } else {
    // 亮色主题阴影
    root.style.setProperty(
      "--theme-shadow-sm",
      "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    );
    root.style.setProperty(
      "--theme-shadow-md",
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    );
    root.style.setProperty(
      "--theme-shadow-lg",
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    );
  }
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
