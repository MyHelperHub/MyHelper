/**
 * 主题辅助工具函数
 * 提供便捷的主题操作和样式生成方法
 */

import { colorUtils } from "./theme";

/**
 * 动态添加主题类到元素
 */
export function addThemeClass(element: HTMLElement, themeClass: string): void {
  element.classList.add(`theme-${themeClass}`);
}

/**
 * 移除主题类
 */
export function removeThemeClass(
  element: HTMLElement,
  themeClass: string,
): void {
  element.classList.remove(`theme-${themeClass}`);
}

/**
 * 切换主题类
 */
export function toggleThemeClass(
  element: HTMLElement,
  themeClass: string,
): void {
  element.classList.toggle(`theme-${themeClass}`);
}

/**
 * 为元素应用主题样式
 */
export function applyThemeStyle(
  element: HTMLElement,
  styles: Record<string, string>,
): void {
  Object.entries(styles).forEach(([property, value]) => {
    if (value.startsWith("--theme-")) {
      element.style.setProperty(property, `var(${value})`);
    } else {
      element.style.setProperty(property, value);
    }
  });
}

/**
 * 获取CSS变量值
 */
export function getThemeVariable(variableName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--theme-${variableName}`)
    .trim();
}

/**
 * 设置CSS变量值
 */
export function setThemeVariable(variableName: string, value: string): void {
  document.documentElement.style.setProperty(`--theme-${variableName}`, value);
}

/**
 * 生成主题色板
 */
export function generateThemePalette(
  baseColor: string,
): Record<string, string> {
  const palette = colorUtils.generatePalette(baseColor);
  return {
    "50": palette[0].hex,
    "100": palette[1].hex,
    "200": palette[2].hex,
    "300": palette[3].hex,
    "400": palette[4].hex,
    "500": palette[5].hex, // base color
    "600": palette[6].hex,
    "700": palette[7].hex,
    "800": palette[8].hex,
    "900": palette[9].hex,
  };
}

/**
 * 根据背景色自动选择合适的文字颜色
 */
export function getContrastTextColor(backgroundColor: string): string {
  // 将十六进制颜色转换为 RGB
  const rgb = colorUtils.hexToRgb(backgroundColor);
  const rgbMatch = rgb.match(/\d+/g);

  if (!rgbMatch) return getThemeVariable("text");

  const [r, g, b] = rgbMatch.map(Number);

  // 计算亮度（使用相对亮度公式）
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // 根据亮度选择文字颜色
  return luminance > 0.5
    ? getThemeVariable("text")
    : getThemeVariable("background");
}

/**
 * 创建主题化的渐变背景
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
 */
export function createThemeBorder(
  width: number = 1,
  style: string = "solid",
  color: string = "border",
): string {
  return `${width}px ${style} var(--theme-${color})`;
}

/**
 * 检查当前是否为暗色主题
 */
export function isDarkTheme(): boolean {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/**
 * 为组件生成主题化的样式对象
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
 * 主题动画辅助函数
 */
export const themeAnimations = {
  /**
   * 平滑的主题切换动画
   */
  smoothTransition: (element: HTMLElement, duration: number = 300): void => {
    element.style.transition = `all ${duration}ms cubic-bezier(0.25, 1, 0.5, 1)`;

    // 动画结束后移除过渡
    setTimeout(() => {
      element.style.transition = "";
    }, duration);
  },

  /**
   * 颜色渐变动画
   */
  colorTransition: (
    element: HTMLElement,
    property: string,
    fromColor: string,
    toColor: string,
    duration: number = 300,
  ): void => {
    element.style.setProperty(property, fromColor);
    element.style.transition = `${property} ${duration}ms ease`;

    requestAnimationFrame(() => {
      element.style.setProperty(property, toColor);
    });
  },

  /**
   * 阴影动画
   */
  shadowTransition: (
    element: HTMLElement,
    fromShadow: string,
    toShadow: string,
    duration: number = 300,
  ): void => {
    element.style.boxShadow = fromShadow;
    element.style.transition = `box-shadow ${duration}ms ease`;

    requestAnimationFrame(() => {
      element.style.boxShadow = toShadow;
    });
  },
};

/**
 * 响应式主题工具
 */
export const responsiveTheme = {
  /**
   * 根据屏幕尺寸调整主题样式
   */
  adjustForViewport: (): void => {
    const isMobile = window.innerWidth < 768;
    const root = document.documentElement;

    if (isMobile) {
      root.style.setProperty(
        "--theme-shadow-sm",
        "0 1px 2px rgba(var(--theme-text-rgb), 0.1)",
      );
      root.style.setProperty(
        "--theme-shadow-md",
        "0 2px 8px rgba(var(--theme-primary-rgb), 0.1)",
      );
      root.style.setProperty(
        "--theme-shadow-lg",
        "0 4px 16px rgba(var(--theme-primary-rgb), 0.15)",
      );
    } else {
      // 恢复默认阴影
      root.style.removeProperty("--theme-shadow-sm");
      root.style.removeProperty("--theme-shadow-md");
      root.style.removeProperty("--theme-shadow-lg");
    }
  },

  /**
   * 监听视口变化
   */
  watchViewport: (): void => {
    window.addEventListener("resize", responsiveTheme.adjustForViewport);
    responsiveTheme.adjustForViewport(); // 初始调用
  },
};

/**
 * 无障碍主题工具
 */
export const accessibilityTheme = {
  /**
   * 检查用户偏好
   */
  checkUserPreferences: (): void => {
    // 检查用户是否偏好减少动画
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("reduce-motion");
    }

    // 检查用户是否偏好高对比度
    if (window.matchMedia("(prefers-contrast: high)").matches) {
      document.documentElement.classList.add("high-contrast");
    }

    // 检查用户是否偏好暗色主题
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      // 可以根据需要自动切换到暗色主题
      console.log("用户偏好暗色主题");
    }
  },

  /**
   * 监听用户偏好变化
   */
  watchPreferences: (): void => {
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

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        console.log("用户系统主题偏好变化:", e.matches ? "dark" : "light");
      });
  },
};

/**
 * 初始化主题辅助工具
 */
export function initThemeHelpers(): void {
  // 检查和监听用户偏好
  accessibilityTheme.checkUserPreferences();
  accessibilityTheme.watchPreferences();

  // 监听视口变化
  responsiveTheme.watchViewport();
}
