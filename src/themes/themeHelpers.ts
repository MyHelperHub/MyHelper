/**
 * 主题辅助工具函数
 */

import { colorUtils } from "./theme";

/**
 * 根据背景色自动选择合适的文字颜色
 * @param backgroundColor - 背景颜色的十六进制值
 * @returns 合适的文字颜色CSS变量
 */
export function getContrastTextColor(backgroundColor: string): string {
  const rgb = colorUtils.hexToRgb(backgroundColor);
  const rgbMatch = rgb.match(/\d+/g);

  if (!rgbMatch) return "var(--theme-text)";

  const [r, g, b] = rgbMatch.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "var(--theme-text)" : "var(--theme-background)";
}

/**
 * 创建主题化的渐变背景
 * @param startColor - 起始颜色
 * @param endColor - 结束颜色
 * @param angle - 渐变角度，默认45度
 * @returns CSS渐变字符串
 */
export function createThemeGradient(
  startColor: string,
  endColor: string,
  angle: number = 45,
): string {
  return `linear-gradient(${angle}deg, var(--theme-${startColor}), var(--theme-${endColor}))`;
}

/**
 * 创建主题化的阴影
 * @param offsetX - X轴偏移
 * @param offsetY - Y轴偏移
 * @param blur - 模糊半径
 * @param color - 阴影颜色主题变量名
 * @param opacity - 透明度
 * @returns CSS阴影字符串
 */
export function createThemeShadow(
  offsetX: number = 0,
  offsetY: number = 4,
  blur: number = 12,
  color: string = "primary",
  opacity: number = 0.15,
): string {
  return `${offsetX}px ${offsetY}px ${blur}px rgba(var(--theme-${color}-rgb), ${opacity})`;
}

/**
 * 创建主题化的边框
 * @param width - 边框宽度
 * @param style - 边框样式
 * @param color - 边框颜色主题变量名
 * @returns CSS边框字符串
 */
export function createThemeBorder(
  width: number = 1,
  style: string = "solid",
  color: string = "border",
): string {
  return `${width}px ${style} var(--theme-${color})`;
}

/**
 * 为组件生成主题化的样式对象
 * @param config - 样式配置对象
 * @returns 样式对象
 */
export function generateComponentTheme(config: {
  background?: string;
  text?: string;
  border?: string;
  shadow?: boolean;
  gradient?: boolean;
}): Record<string, string> {
  const styles: Record<string, string> = {};

  if (config.background) {
    styles.background = `var(--theme-${config.background})`;
  }

  if (config.text) {
    styles.color = `var(--theme-${config.text})`;
  }

  if (config.border) {
    styles.border = createThemeBorder(1, "solid", config.border);
  }

  if (config.shadow) {
    styles.boxShadow = "var(--theme-shadow-md)";
  }

  if (config.gradient) {
    styles.background = "var(--theme-gradient)";
  }

  return styles;
}

/**
 * 初始化主题辅助功能
 */
export function initThemeHelpers(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reduce-motion");
  }

  if (window.matchMedia("(prefers-contrast: high)").matches) {
    document.documentElement.classList.add("high-contrast");
  }

  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", (e) => {
      document.documentElement.classList.toggle("reduce-motion", e.matches);
    });

  window
    .matchMedia("(prefers-contrast: high)")
    .addEventListener("change", (e) => {
      document.documentElement.classList.toggle("high-contrast", e.matches);
    });
}
