/**
 * 简化的 PrimeVue 主题色对接
 */

import type { ThemeColors, ThemeMode } from "@/interface/theme.d";
import { colorUtils } from "../theme";

/**
 * 将主题颜色应用到 PrimeVue --p-* 变量
 */
export function applyPrimeVueTheme(colors: ThemeColors, mode: ThemeMode): void {
  const root = document.documentElement;

  // 生成主色调色板
  const primaryPalette = generatePrimaryPalette(colors.primary.hex);

  // 批量更新主色调色板变量
  Object.entries(primaryPalette).forEach(([key, value]) => {
    root.style.setProperty(`--p-primary-${key}`, value);
  });

  // 设置暗色模式类
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * 生成主色调色板 (50-950)
 */
function generatePrimaryPalette(baseColor: string): Record<string, string> {
  const palette: Record<string, string> = {};
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  steps.forEach((step, index) => {
    const adjustment = (index - 5) * 15; // 500 为基础色
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
