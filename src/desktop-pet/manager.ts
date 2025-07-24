import type { IAnimationRenderer, AnimationModel, RenderConfig } from './types';
import { createRenderer, isRendererSupported } from './factory';
import { modelDetector } from './detector';

/**
 * 动画管理器类
 * 负责管理渲染器的生命周期和模型的加载切换
 */
export class AnimationManager {
  private renderer?: IAnimationRenderer;
  private currentModel?: AnimationModel;
  private container?: HTMLElement;
  private config?: RenderConfig;
  private isInitialized = false;
  private isDestroyed = false;

  constructor() {
    // 构造函数不需要特殊操作
  }

  /**
   * 初始化管理器
   * @param container 渲染容器
   * @param config 渲染配置
   */
  async initialize(container: HTMLElement, config: RenderConfig): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('管理器已被销毁，无法重新初始化');
    }

    if (this.isInitialized) {
      console.warn('管理器已经初始化，跳过重复初始化');
      return;
    }

    this.container = container;
    this.config = { ...config };
    this.isInitialized = true;

    // 清空容器
    container.innerHTML = '';
    
    console.log('动画管理器初始化完成');
  }

  /**
   * 加载并显示模型
   * @param model 要加载的模型
   */
  async loadModel(model: AnimationModel): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    if (this.isDestroyed) {
      throw new Error('管理器已被销毁');
    }

    try {
      // 检查技术支持
      if (!isRendererSupported(model.technology)) {
        throw new Error(`不支持的动画技术: ${model.technology}`);
      }

      // 如果当前已有渲染器且技术类型不同，需要销毁重建
      if (this.renderer && this.currentModel?.technology !== model.technology) {
        this.destroyCurrentRenderer();
      }

      // 创建新渲染器（如果需要）
      if (!this.renderer) {
        this.renderer = createRenderer(model.technology);
        await this.renderer.init(this.container!, this.config!);
      }

      // 加载模型
      await this.renderer.loadModel(model.path);
      this.currentModel = model;

      console.log(`模型加载成功: ${model.name} (${model.technology})`);

    } catch (error) {
      console.error('模型加载失败:', error);
      this.destroyCurrentRenderer();
      throw error;
    }
  }

  /**
   * 根据模型ID加载模型
   * @param modelId 模型ID
   */
  async loadModelById(modelId: string): Promise<void> {
    const model = await modelDetector.getModelById(modelId);
    if (!model) {
      throw new Error(`未找到模型: ${modelId}`);
    }

    await this.loadModel(model);
  }

  /**
   * 播放动画
   * @param motionName 动画名称，不传则播放默认动画
   */
  play(motionName?: string): void {
    if (!this.renderer) {
      console.warn('没有活动的渲染器');
      return;
    }

    this.renderer.play(motionName);
  }

  /**
   * 暂停动画
   */
  pause(): void {
    if (!this.renderer) {
      console.warn('没有活动的渲染器');
      return;
    }

    this.renderer.pause();
  }

  /**
   * 设置缩放比例
   * @param scale 缩放比例
   */
  setScale(scale: number): void {
    if (!this.renderer) {
      console.warn('没有活动的渲染器');
      return;
    }

    if (this.config) {
      this.config.scale = scale;
    }

    this.renderer.setScale(scale);
  }

  /**
   * 设置交互性
   * @param interactive 是否可交互
   */
  setInteractive(interactive: boolean): void {
    if (!this.renderer) {
      console.warn('没有活动的渲染器');
      return;
    }

    if (this.config) {
      this.config.interactive = interactive;
    }

    this.renderer.setInteractive(interactive);
  }

  /**
   * 设置模型点击回调
   * @param callback 点击回调函数
   */
  onModelClick(callback: () => void): void {
    if (!this.renderer) {
      console.warn('没有活动的渲染器');
      return;
    }

    this.renderer.onModelClick?.(callback);
  }

  /**
   * 调整容器大小
   * @param width 新宽度
   * @param height 新高度
   */
  async resize(width: number, height: number): Promise<void> {
    if (!this.config || !this.container) {
      console.warn('管理器未正确初始化');
      return;
    }

    // 更新配置
    this.config.width = width;
    this.config.height = height;

    // 更新容器样式
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;

    // 如果有当前模型，重新加载以应用新尺寸
    if (this.currentModel && this.renderer) {
      try {
        this.destroyCurrentRenderer();
        this.renderer = createRenderer(this.currentModel.technology);
        await this.renderer.init(this.container, this.config);
        await this.renderer.loadModel(this.currentModel.path);
      } catch (error) {
        console.error('调整大小时重新加载模型失败:', error);
      }
    }
  }

  /**
   * 获取当前模型信息
   */
  getCurrentModel(): AnimationModel | undefined {
    return this.currentModel;
  }

  /**
   * 获取管理器状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isDestroyed: this.isDestroyed,
      hasRenderer: !!this.renderer,
      hasModel: !!this.currentModel,
      currentTechnology: this.currentModel?.technology,
      config: this.config ? { ...this.config } : undefined,
    };
  }

  /**
   * 检查是否有活动的模型
   */
  hasActiveModel(): boolean {
    return !!this.renderer && !!this.currentModel;
  }

  /**
   * 清除当前模型
   */
  clearModel(): void {
    this.destroyCurrentRenderer();
    this.currentModel = undefined;
  }

  /**
   * 销毁当前渲染器
   */
  private destroyCurrentRenderer(): void {
    if (this.renderer) {
      try {
        this.renderer.destroy();
      } catch (error) {
        console.error('销毁渲染器时出错:', error);
      }
      this.renderer = undefined;
    }
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.destroyCurrentRenderer();
    this.currentModel = undefined;
    this.container = undefined;
    this.config = undefined;
    this.isInitialized = false;
    this.isDestroyed = true;

    console.log('动画管理器已销毁');
  }

  /**
   * 获取可用的模型列表
   */
  async getAvailableModels(): Promise<AnimationModel[]> {
    return await modelDetector.getAllModels();
  }

  /**
   * 根据技术类型获取模型列表
   */
  async getModelsByTechnology(technology: string): Promise<AnimationModel[]> {
    return await modelDetector.getModelsByTechnology(technology as any);
  }

  /**
   * 验证模型是否可用
   */
  async validateModel(model: AnimationModel): Promise<boolean> {
    return await modelDetector.validateModel(model);
  }
}

// 创建管理器实例的工厂函数
export const createAnimationManager = (): AnimationManager => {
  return new AnimationManager();
};