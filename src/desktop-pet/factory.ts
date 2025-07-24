import type { IAnimationRenderer, AnimationTechnology } from './types';
import { Live2DRenderer } from './renderers/live2d';
import { SpineRenderer } from './renderers/spine';
import { LottieRenderer } from './renderers/lottie';

/**
 * 渲染器工厂类
 */
export class RendererFactory {
  private static rendererMap = new Map<AnimationTechnology, new () => IAnimationRenderer>();

  static {
    // 使用静态初始化块来避免类型问题
    RendererFactory.rendererMap.set('live2d' as AnimationTechnology, Live2DRenderer);
    RendererFactory.rendererMap.set('spine' as AnimationTechnology, SpineRenderer);
    RendererFactory.rendererMap.set('lottie' as AnimationTechnology, LottieRenderer);
  }

  /**
   * 根据动画技术类型创建渲染器
   * @param technology 动画技术类型
   * @returns 渲染器实例
   */
  static createRenderer(technology: AnimationTechnology): IAnimationRenderer {
    const RendererClass = this.rendererMap.get(technology);
    
    if (!RendererClass) {
      throw new Error(`不支持的动画技术类型: ${technology}`);
    }

    return new RendererClass();
  }

  /**
   * 检查是否支持指定的动画技术
   * @param technology 动画技术类型
   * @returns 是否支持
   */
  static isSupported(technology: AnimationTechnology): boolean {
    return this.rendererMap.has(technology);
  }

  /**
   * 获取所有支持的动画技术类型
   * @returns 支持的技术类型数组
   */
  static getSupportedTechnologies(): AnimationTechnology[] {
    return Array.from(this.rendererMap.keys());
  }

  /**
   * 注册新的渲染器类型
   * @param technology 动画技术类型
   * @param rendererClass 渲染器类
   */
  static registerRenderer(
    technology: AnimationTechnology, 
    rendererClass: new () => IAnimationRenderer
  ): void {
    this.rendererMap.set(technology, rendererClass);
  }

  /**
   * 移除渲染器类型支持
   * @param technology 动画技术类型
   */
  static unregisterRenderer(technology: AnimationTechnology): void {
    this.rendererMap.delete(technology);
  }

  /**
   * 获取渲染器的显示名称
   * @param technology 动画技术类型
   * @returns 显示名称
   */
  static getDisplayName(technology: AnimationTechnology): string {
    const nameMap = {
      'live2d': 'Live2D',
      'spine': 'Spine',
      'lottie': 'Lottie',
      'unknown': '未知',
    };

    return nameMap[technology] || '未知';
  }

  /**
   * 获取渲染器的描述信息
   * @param technology 动画技术类型
   * @returns 描述信息
   */
  static getDescription(technology: AnimationTechnology): string {
    const descriptionMap = {
      'live2d': 'Live2D Cubism 模型渲染器，支持2D角色动画和交互',
      'spine': 'Spine 2D骨骼动画渲染器（预留）',
      'lottie': 'Lottie 动画渲染器（预留）',
      'unknown': '未知的动画技术类型',
    };

    return descriptionMap[technology] || '未知的动画技术类型';
  }
}

// 导出工厂实例方法的简化接口
export const createRenderer = (technology: AnimationTechnology): IAnimationRenderer => {
  return RendererFactory.createRenderer(technology);
};

export const isRendererSupported = (technology: AnimationTechnology): boolean => {
  return RendererFactory.isSupported(technology);
};

export const getSupportedRenderers = (): AnimationTechnology[] => {
  return RendererFactory.getSupportedTechnologies();
};