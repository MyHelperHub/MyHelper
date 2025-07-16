/**
 * 简化的 PrimeVue 主题集成
 */

import type { ThemeColors, ThemeMode } from "@/interface/theme.d";
import { colorUtils } from "../theme";

/**
 * 将主题颜色转换为 PrimeVue CSS 变量
 */
export function applyPrimeVueTheme(colors: ThemeColors, mode: ThemeMode): void {
  const isDark = mode === "dark";
  
  // 生成主色调色板
  const primaryPalette = generatePrimaryPalette(colors.primary.hex);
  
  // 创建 CSS 变量
  const variables: Record<string, string> = {};
  
  // 主色调变量
  Object.entries(primaryPalette).forEach(([key, value]) => {
    variables[`--p-primary-${key}`] = value;
  });
  
  // 基础颜色变量
  variables['--p-primary-color'] = colors.primary.hex;
  variables['--p-text-color'] = colors.text.hex;
  variables['--p-text-muted-color'] = colors.textMuted.hex;
  variables['--p-surface-0'] = colors.background.hex;
  variables['--p-surface-50'] = colors.backgroundSecondary.hex;
  variables['--p-content-background'] = colors.backgroundCard.hex;
  variables['--p-content-border-color'] = colors.border.hex;
  variables['--p-highlight-background'] = `${colors.primary.hex}1a`;
  variables['--p-highlight-color'] = colors.primary.hex;
  
  // 表单字段变量
  variables['--p-form-field-background'] = colors.backgroundCard.hex;
  variables['--p-form-field-border-color'] = colors.border.hex;
  variables['--p-form-field-focus-border-color'] = colors.primary.hex;
  variables['--p-form-field-color'] = colors.text.hex;
  
  // 应用变量到文档
  const root = document.documentElement;
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * 生成主色调色板
 */
function generatePrimaryPalette(baseColor: string): Record<string, string> {
  const palette: Record<string, string> = {};
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  
  steps.forEach((step, index) => {
    const adjustment = (index - 5) * 15; // 500 为基础色
    if (adjustment === 0) {
      palette[step.toString()] = baseColor;
    } else if (adjustment < 0) {
      palette[step.toString()] = colorUtils.lighten(baseColor, Math.abs(adjustment));
    } else {
      palette[step.toString()] = colorUtils.darken(baseColor, adjustment);
    }
  });
  
  return palette;
}