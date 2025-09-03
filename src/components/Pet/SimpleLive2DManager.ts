import { convertFileSrc } from "@tauri-apps/api/core";
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile, readDir } from "@tauri-apps/plugin-fs";
import { Application, Ticker } from "pixi.js";
import {
  Live2DModel,
  Cubism4ModelSettings,
} from "pixi-live2d-display-lipsyncpatch";
import type { ModelConfig, ModelInfo } from "@/interface/pet";
import { Logger } from "@/utils/logger";

/**
 * 简化版Live2D模型管理器
 * 专注于模型加载和显示，移除复杂的工厂模式和多态设计
 */
export class SimpleLive2DManager {
  // 全局Application实例管理，确保每个canvas只有一个Application
  private static apps = new Map<HTMLCanvasElement, Application>();
  
  private app: Application | null = null;
  private model: Live2DModel | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private modelScale: number = 0.8;

  /**
   * 获取或创建指定canvas的PIXI Application实例
   */
  private static getOrCreateApp(canvas: HTMLCanvasElement): Application {
    if (!this.apps.has(canvas)) {
      const app = new Application({
        view: canvas,
        autoStart: true,
        backgroundAlpha: 0,
        resolution: devicePixelRatio,
        width: canvas.width,
        height: canvas.height,
        powerPreference: "default",
      });
      this.apps.set(canvas, app);
      Logger.info("SimpleLive2DManager: 创建新的PIXI Application");
    }
    return this.apps.get(canvas)!;
  }

  /**
   * 销毁指定canvas的PIXI Application实例
   */
  private static destroyApp(canvas: HTMLCanvasElement): void {
    const app = this.apps.get(canvas);
    if (app) {
      try {
        app.destroy(true);
        this.apps.delete(canvas);
        Logger.info("SimpleLive2DManager: 销毁PIXI Application");
      } catch (error) {
        Logger.warn("SimpleLive2DManager: 销毁PIXI Application时出现警告", String(error));
      }
    }
  }

  /**
   * 初始化PIXI应用实例
   */
  private initApp(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.app = SimpleLive2DManager.getOrCreateApp(canvas);
  }

  /**
   * 自动查找模型配置文件
   */
  private async findModelConfig(modelPath: string): Promise<string | null> {
    try {
      const actualPath = await resolveResource(modelPath);
      const files = await readDir(actualPath);

      const configFile = files.find(
        (file) => file.name.endsWith(".model3.json") && file.isFile,
      );

      return configFile ? configFile.name : null;
    } catch (error) {
      Logger.warn("SimpleLive2DManager: 无法读取模型目录", `Path: ${modelPath}, Error: ${error}`);
      return null;
    }
  }

  /**
   * 预处理模型资源文件路径，转换为Tauri可用的路径
   */
  private async preprocessResourcePaths(
    modelSettings: Cubism4ModelSettings,
    modelPath: string,
    modelJSON: any,
  ): Promise<void> {
    const filePathMap = new Map<string, string>();
    const allFiles = this.collectResourceFiles(modelJSON);

    for (const file of allFiles) {
      if (file) {
        try {
          const resourcePath = `${modelPath}/${file}`;
          const actualFilePath = await resolveResource(resourcePath);
          filePathMap.set(file, convertFileSrc(actualFilePath));
        } catch (error) {
          Logger.error(`SimpleLive2DManager: 无法解析资源文件: ${file}`, String(error));
        }
      }
    }

    modelSettings.replaceFiles((file) => {
      return filePathMap.get(file) || convertFileSrc(`${modelPath}/${file}`);
    });
  }

  /**
   * 收集模型JSON配置中引用的所有资源文件路径
   */
  private collectResourceFiles(modelJSON: any): string[] {
    const files: string[] = [];
    const refs = modelJSON.FileReferences;

    if (!refs) return files;

    if (refs.Moc) files.push(refs.Moc);
    if (refs.DisplayInfo) files.push(refs.DisplayInfo);
    if (refs.Textures) files.push(...refs.Textures);

    if (refs.Expressions) {
      files.push(
        ...refs.Expressions.map((exp: any) => exp.File).filter(Boolean),
      );
    }

    if (refs.Motions) {
      Object.values(refs.Motions).forEach((motionGroup: any) => {
        if (Array.isArray(motionGroup)) {
          files.push(
            ...motionGroup.map((motion: any) => motion.File).filter(Boolean),
          );
          files.push(
            ...motionGroup.map((motion: any) => motion.Sound).filter(Boolean),
          );
        }
      });
    }

    return files.filter(Boolean);
  }

  /**
   * 设置模型的位置、缩放和锚点变换
   */
  private setupModelTransform(canvas: HTMLCanvasElement): void {
    if (!this.model) return;

    try {
      this.model.scale.set(1);
      this.model.x = 0;
      this.model.y = 0;
      this.model.anchor.set(0.5, 0.5);

      const { width, height } = this.model;

      // 确保画布和模型尺寸有效
      if (canvas.width <= 0 || canvas.height <= 0 || width <= 0 || height <= 0) {
        return;
      }

      // 简单直接的缩放：让模型适配画布
      const scaleX = canvas.width / width;
      const scaleY = canvas.height / height;
      const finalScale = Math.min(scaleX, scaleY) * this.modelScale;

      this.model.scale.set(finalScale);
      this.model.x = canvas.width / 2;
      this.model.y = canvas.height / 2;
    } catch (error) {
      Logger.error("SimpleLive2DManager: 设置模型变换失败", String(error));
    }
  }

  /**
   * 加载Live2D模型到指定画布
   */
  async load(
    canvas: HTMLCanvasElement,
    config: ModelConfig,
  ): Promise<ModelInfo | null> {
    this.initApp(canvas);
    this.destroyModel(); // 只销毁模型，保留Application

    try {
      const configFileName =
        config.configFile || (await this.findModelConfig(config.path));
      if (!configFileName) {
        throw new Error("未找到模型配置文件");
      }

      const configPath = `${config.path}/${configFileName}`;
      const actualConfigPath = await resolveResource(configPath);
      const modelJSON = JSON.parse(await readTextFile(actualConfigPath));

      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: convertFileSrc(actualConfigPath),
      });

      await this.preprocessResourcePaths(modelSettings, config.path, modelJSON);

      this.model = await Live2DModel.from(modelSettings, {
        ticker: Ticker.shared,
      });

      if (!this.model) {
        throw new Error("模型创建失败");
      }

      this.setupModelTransform(canvas);

      // 清空stage并添加新模型
      if (this.app?.stage) {
        // 清空所有子对象
        while (this.app.stage.children.length > 0) {
          const child = this.app.stage.children[0];
          this.app.stage.removeChild(child);
        }

        this.app.stage.addChild(this.model);
      }

      const result: ModelInfo = {
        width: this.model.width,
        height: this.model.height,
        motions: modelSettings.motions || {},
        expressions: modelSettings.expressions || [],
      };

      Logger.info("SimpleLive2DManager: 模型加载成功", config.name);
      return result;
    } catch (error) {
      Logger.error(`SimpleLive2DManager: 加载Live2D模型失败: ${config.name}`, String(error));
      throw error;
    }
  }

  /**
   * 调整模型以适应画布尺寸变化
   */
  resize(canvas: HTMLCanvasElement): void {
    if (!this.model || !canvas) return;
    
    // 只重新计算模型变换
    this.setupModelTransform(canvas);
  }

  /**
   * 播放指定分组的动作
   */
  playMotion(group: string, index: number): any {
    return this.model?.motion(group, index);
  }

  /**
   * 播放指定索引的表情
   */
  playExpression(index: number): any {
    return this.model?.expression(index);
  }

  /**
   * 设置模型缩放比例
   */
  setModelScale(scale: number): void {
    const newScale = Math.max(0.1, Math.min(2.0, scale));
    this.modelScale = newScale;
    if (this.canvas && this.model) {
      this.setupModelTransform(this.canvas);
    }
  }

  /**
   * 获取当前模型缩放比例
   */
  getModelScale(): number {
    return this.modelScale;
  }

  /**
   * 销毁当前模型但保留PIXI Application
   */
  destroyModel(): void {
    if (this.model) {
      try {
        // 从stage中移除模型
        if (this.app?.stage && this.model.parent) {
          this.app.stage.removeChild(this.model);
        }

        // 销毁模型对象
        if (!this.model.destroyed && typeof this.model.destroy === 'function') {
          this.model.destroy();
        }
      } catch (error) {
        // 静默处理销毁错误
        Logger.warn("SimpleLive2DManager: 销毁模型时出现警告", String(error));
      }
      this.model = null;
    }
  }

  /**
   * 完全销毁管理器，包括PIXI Application（组件卸载时调用）
   */
  destroy(): void {
    this.destroyModel();
    
    if (this.canvas) {
      SimpleLive2DManager.destroyApp(this.canvas);
      this.canvas = null;
    }
    this.app = null;
  }

  /**
   * 检查模型是否有效且未被销毁
   */
  isModelValid(): boolean {
    return this.model && !this.model.destroyed;
  }
}