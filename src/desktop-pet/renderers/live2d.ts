import * as PIXI from 'pixi.js';
// import * as EasyLive2D from 'easy-live2d'; // 暂时注释，等待API修复
import type { IAnimationRenderer, RenderConfig } from '../types';

export class Live2DRenderer implements IAnimationRenderer {
  private app?: PIXI.Application;
  private model?: any; // EasyLive2D模型类型
  private container?: HTMLElement;
  private config?: RenderConfig;
  private modelClickCallback?: () => void;
  private isDestroyed = false;

  constructor() {
    // 初始化时不需要特殊操作
  }

  async init(container: HTMLElement, config: RenderConfig): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('渲染器已被销毁，无法重新初始化');
    }

    this.container = container;
    this.config = config;

    try {
      // 创建PIXI应用
      this.app = new PIXI.Application({
        width: config.width,
        height: config.height,
        backgroundAlpha: 0, // 透明背景
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        resizeTo: container,
      });

      // 等待PIXI应用初始化完成
      await this.app.init();

      // 将canvas添加到容器
      container.appendChild(this.app.canvas);

      // 设置容器样式
      container.style.width = `${config.width}px`;
      container.style.height = `${config.height}px`;
      container.style.overflow = 'hidden';

    } catch (error) {
      console.error('Live2D渲染器初始化失败:', error);
      throw error;
    }
  }

  async loadModel(modelPath: string): Promise<void> {
    if (!this.app) {
      throw new Error('渲染器未初始化');
    }

    try {
      // 如果已有模型，先销毁
      if (this.model) {
        this.app.stage.removeChild(this.model);
        this.model.destroy();
      }

      // 构建模型文件路径（asset://协议）
      const assetPath = modelPath.startsWith('asset://') 
        ? modelPath 
        : `asset://${modelPath.replace(/\\/g, '/')}`;

      // 查找model3.json文件
      // const modelJsonPath = await this.findModelJsonFile(assetPath);
      
      // 加载Live2D模型
      // TODO: 修复easy-live2d的正确API调用
      // this.model = await EasyLive2D.from(modelJsonPath);
      
      // 临时占位，避免编译错误
      console.warn('Live2D模型加载暂未实现，需要修复easy-live2d API调用');
      console.warn('资源路径:', assetPath);
      this.model = null;

      if (!this.model) {
        throw new Error('模型加载失败');
      }

      // 设置模型初始位置和缩放
      this.model.anchor.set(0.5, 0.5);
      this.model.position.set(this.config!.width / 2, this.config!.height / 2);
      
      // 自适应缩放
      this.adjustModelScale();

      // 添加到舞台
      this.app.stage.addChild(this.model);

      // 设置交互性
      if (this.config!.interactive !== false) {
        this.setInteractive(true);
      }

      // 开始默认动画
      this.playIdleAnimation();

    } catch (error) {
      console.error('Live2D模型加载失败:', error);
      throw error;
    }
  }

  // 临时注释，避免未使用的函数警告
  /*
  private async findModelJsonFile(basePath: string): Promise<string> {
    // 构建runtime目录路径
    const runtimePath = basePath.endsWith('/') ? `${basePath}runtime` : `${basePath}/runtime`;
    
    // 这里需要根据实际模型文件名调整
    // 由于我们知道现有模型的结构，直接使用已知的文件名
    return `${runtimePath}/mark_free_t04.model3.json`;
  }
  */

  private adjustModelScale(): void {
    if (!this.model || !this.config) return;

    const modelBounds = this.model.getBounds();
    const scaleX = (this.config.width * 0.8) / modelBounds.width;
    const scaleY = (this.config.height * 0.8) / modelBounds.height;
    
    // 使用较小的缩放比例保持比例
    const scale = Math.min(scaleX, scaleY);
    
    // 应用用户设置的缩放
    const finalScale = scale * (this.config.scale || 1);
    
    this.model.scale.set(finalScale);
  }

  play(motionName?: string): void {
    if (!this.model) return;

    try {
      if (motionName) {
        // 播放指定动作
        this.model.motion(motionName);
      } else {
        // 播放默认闲置动画
        this.playIdleAnimation();
      }
    } catch (error) {
      console.warn('播放动作失败:', error);
    }
  }

  private playIdleAnimation(): void {
    if (!this.model) return;

    try {
      // 尝试播放闲置动画，如果没有则播放第一个可用动画
      this.model.motion('Idle') || this.model.motion(0);
    } catch (error) {
      console.warn('播放闲置动画失败:', error);
    }
  }

  pause(): void {
    if (!this.model) return;

    try {
      // 暂停当前动画
      this.model.stopAllMotions();
    } catch (error) {
      console.warn('暂停动画失败:', error);
    }
  }

  setScale(scale: number): void {
    if (!this.config) return;
    
    this.config.scale = scale;
    this.adjustModelScale();
  }

  setInteractive(interactive: boolean): void {
    if (!this.model) return;

    this.model.interactive = interactive;
    this.model.buttonMode = interactive;

    if (interactive) {
      // 添加点击事件
      this.model.on('pointerdown', this.handleModelClick.bind(this));
      
      // 添加鼠标跟踪
      this.model.on('pointermove', this.handleMouseMove.bind(this));
    } else {
      // 移除事件监听
      this.model.off('pointerdown', this.handleModelClick.bind(this));
      this.model.off('pointermove', this.handleMouseMove.bind(this));
    }
  }

  private handleModelClick(): void {
    // 播放点击动作
    this.playRandomTapMotion();
    
    // 调用回调函数
    if (this.modelClickCallback) {
      this.modelClickCallback();
    }
  }

  private handleMouseMove(event: PIXI.FederatedPointerEvent): void {
    if (!this.model) return;

    try {
      // 获取鼠标在模型坐标系中的位置
      const localPoint = this.model.toLocal(event.global);
      
      // 将坐标标准化到[-1, 1]范围
      const x = (localPoint.x / this.config!.width - 0.5) * 2;
      const y = (localPoint.y / this.config!.height - 0.5) * 2;
      
      // 更新眼部跟踪参数
      this.updateEyeTracking(x, y);
    } catch (error) {
      console.warn('鼠标跟踪失败:', error);
    }
  }

  private updateEyeTracking(x: number, y: number): void {
    if (!this.model) return;

    try {
      // 设置常见的眼部跟踪参数
      this.model.internalModel.coreModel.setParameterValueByIndex(0, x * 30); // ParamEyeLOpen
      this.model.internalModel.coreModel.setParameterValueByIndex(1, y * 30); // ParamEyeROpen
      // 更多参数可以根据模型的具体配置调整
    } catch (error) {
      // 静默处理，不是所有模型都有眼部跟踪参数
    }
  }

  private playRandomTapMotion(): void {
    if (!this.model) return;

    try {
      // 尝试播放点击相关的动作
      const tapMotions = ['Tap', 'Touch', 'Click'];
      const randomMotion = tapMotions[Math.floor(Math.random() * tapMotions.length)];
      
      // 如果没有找到点击动作，播放随机动作
      if (!this.model.motion(randomMotion)) {
        const motionCount = this.model.internalModel.motionManager.getMotionCount('');
        if (motionCount > 0) {
          const randomIndex = Math.floor(Math.random() * motionCount);
          this.model.motion(randomIndex);
        }
      }
    } catch (error) {
      console.warn('播放点击动作失败:', error);
    }
  }

  onModelClick(callback: () => void): void {
    this.modelClickCallback = callback;
  }

  destroy(): void {
    this.isDestroyed = true;

    // 移除模型
    if (this.model) {
      if (this.app?.stage) {
        this.app.stage.removeChild(this.model);
      }
      this.model.destroy();
      this.model = undefined;
    }

    // 销毁PIXI应用
    if (this.app) {
      if (this.container && this.app.canvas) {
        this.container.removeChild(this.app.canvas);
      }
      this.app.destroy(true);
      this.app = undefined;
    }

    // 清理引用
    this.container = undefined;
    this.config = undefined;
    this.modelClickCallback = undefined;
  }

  // 获取当前模型信息
  getModelInfo() {
    if (!this.model) return null;

    return {
      isLoaded: true,
      canInteract: this.model.interactive,
      bounds: this.model.getBounds(),
      scale: this.model.scale.x,
    };
  }

  // 设置模型表情
  setExpression(expressionName: string): void {
    if (!this.model) return;

    try {
      this.model.expression(expressionName);
    } catch (error) {
      console.warn('设置表情失败:', error);
    }
  }

  // 获取可用的动作列表
  getAvailableMotions(): string[] {
    if (!this.model) return [];

    try {
      // 这需要根据easy-live2d的API调整
      return []; // 返回动作名称列表
    } catch (error) {
      console.warn('获取动作列表失败:', error);
      return [];
    }
  }
}