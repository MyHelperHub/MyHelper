import { convertFileSrc } from "@tauri-apps/api/core";
import { resolveResource, appDataDir } from "@tauri-apps/api/path";
import { readTextFile, readDir } from "@tauri-apps/plugin-fs";
import "@pixi/unsafe-eval";
import { Application, Ticker } from "pixi.js";
import {
  Live2DModel,
  Cubism4ModelSettings,
  configureCubism4,
} from "pixi-live2d-display-advanced";
import type { ModelConfig, ModelInfo, Motion, Expression } from "@/types/pet";
import { Logger } from "@/utils/logger";

/**
 * 简化版Live2D模型管理器
 * 专注于模型加载和显示，移除复杂的工厂模式和多态设计
 */
export class SimpleLive2DManager {
  /** 全局Application实例管理，确保每个canvas只有一个Application */
  private static apps = new Map<HTMLCanvasElement, Application>();
  /** Cubism4 是否已初始化 */
  private static cubism4Initialized = false;

  /** 初始化 Cubism4 运行时（仅调用一次） */
  private static initCubism4(): void {
    if (!this.cubism4Initialized) {
      configureCubism4({ memorySizeMB: 128 });
      this.cubism4Initialized = true;
    }
  }

  /** PIXI应用实例 */
  private app: Application | null = null;
  /** Live2D模型实例 */
  private model: Live2DModel | null = null;
  /** 画布元素 */
  private canvas: HTMLCanvasElement | null = null;
  /** 模型缩放比例 */
  private modelScale: number = 0.8;

  /**
   * 获取或创建指定canvas的PIXI Application实例
   */
  private static getOrCreateApp(canvas: HTMLCanvasElement): Application {
    if (!this.apps.has(canvas)) {
      const width = canvas.width > 0 ? canvas.width : 1;
      const height = canvas.height > 0 ? canvas.height : 1;
      const app = new Application({
        view: canvas,
        autoStart: true,
        backgroundAlpha: 0,
        resolution: 1,
        antialias: true,
        width,
        height,
        powerPreference: "high-performance",
      });
      this.apps.set(canvas, app);
    }
    return this.apps.get(canvas)!;
  }

  /**
   * 更新指定canvas的PIXI Application尺寸
   */
  private static resizeApp(canvas: HTMLCanvasElement): void {
    const app = this.apps.get(canvas);
    if (app && app.renderer) {
      app.renderer.resize(canvas.width, canvas.height);
    }
  }

  /**
   * 销毁指定canvas的PIXI Application实例
   */
  private static destroyApp(canvas: HTMLCanvasElement): void {
    const app = this.apps.get(canvas);
    if (!app) return;

    try {
      app.ticker?.stop();
      app.stage.removeChildren();
      app.renderer?.destroy(false);
      app.destroy(false);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        Logger.warn("PIXI Application destroy warning:", String(error));
      }
    }
    this.apps.delete(canvas);
  }

  /** 清理非活动应用实例 */
  private static cleanupInactiveApps(): void {
    for (const [canvas] of this.apps) {
      if (!canvas.isConnected) {
        this.destroyApp(canvas);
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

  /** 检查是否已取消加载 */
  private checkAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
      throw new DOMException("加载已取消", "AbortError");
    }
  }

  /**
   * 获取实际的配置文件路径（支持子目录）
   */
  private async getActualConfigPath(
    config: ModelConfig,
    configFileName: string,
  ): Promise<string> {
    if (config.source === 0) {
      // 预置模型
      const resourcePath = `${config.path}/${configFileName}`;
      return await resolveResource(resourcePath);
    } else {
      // 用户模型: configFileName 可能包含子目录，如 "runtime/hibiki.model3.json"
      const appDataPath = await appDataDir();
      return `${appDataPath}/${config.path}/${configFileName}`;
    }
  }

  /**
   * 查找模型配置文件（支持多版本）
   */
  private async findModelConfig(config: ModelConfig): Promise<string | null> {
    try {
      let actualPath: string;

      if (config.source === 0) {
        // 预置模型
        actualPath = await resolveResource(config.path);
      } else {
        // 用户模型: config.path = "Models/Live2D/modelname"
        const appDataPath = await appDataDir();
        // appDataDir() 返回 AppData/Roaming/myhelper，与后端 get_myhelper_path() 一致
        actualPath = `${appDataPath}/${config.path}`;
      }

      // 递归查找配置文件
      return await this.findConfigFileRecursive(actualPath);
    } catch (error) {
      Logger.warn(
        "SimpleLive2DManager: 无法读取模型目录",
        `Path: ${config.path}, Source: ${config.source}, Error: ${error}`,
      );
      return null;
    }
  }

  private async findConfigFileRecursive(
    dirPath: string,
  ): Promise<string | null> {
    try {
      const files = await readDir(dirPath);
      const supportedExtensions = [
        ".model.json",
        ".model3.json",
        ".model4.json",
      ];

      // 先在当前目录查找配置文件
      const configFile = files.find(
        (file) =>
          supportedExtensions.some((ext) => file.name.endsWith(ext)) &&
          file.isFile,
      );

      if (configFile) {
        return configFile.name;
      }

      // 如果当前目录没有，递归查找子目录
      for (const file of files) {
        if (file.isDirectory) {
          const subDirPath = `${dirPath}/${file.name}`;
          const result = await this.findConfigFileRecursive(subDirPath);
          if (result) {
            // 返回相对于原始目录的路径
            return `${file.name}/${result}`;
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 预处理模型资源文件路径，转换为Tauri可用的路径
   */
  private async preprocessResourcePaths(
    modelSettings: Cubism4ModelSettings,
    config: ModelConfig,
    modelJSON: any,
    modelBaseDir: string,
  ): Promise<void> {
    const filePathMap = new Map<string, string>();
    const allFiles = this.collectResourceFiles(modelJSON);

    const filePromises = allFiles.map(async (file) => {
      if (file) {
        try {
          let convertedPath: string;
          if (config.source === 0) {
            // 预置模型
            const resourcePath = `${modelBaseDir}/${file}`;
            const actualFilePath = await resolveResource(resourcePath);
            convertedPath = convertFileSrc(actualFilePath);
          } else {
            // 用户模型
            const fullPath = `${modelBaseDir}/${file}`;
            convertedPath = convertFileSrc(fullPath);
          }

          filePathMap.set(file, convertedPath);
          return { file, path: convertedPath };
        } catch (error) {
          Logger.warn(
            `SimpleLive2DManager: 文件路径转换失败: ${file}`,
            String(error),
          );
          // 提供一个后备路径
          const fallbackPath = convertFileSrc(`${modelBaseDir}/${file}`);
          filePathMap.set(file, fallbackPath);
          return { file, path: fallbackPath };
        }
      }
      return null;
    });

    await Promise.all(filePromises);

    modelSettings.replaceFiles((file) => {
      return filePathMap.get(file) || convertFileSrc(`${modelBaseDir}/${file}`);
    });
  }

  /**
   * 收集模型JSON配置中引用的所有资源文件路径
   */
  private collectResourceFiles(modelJSON: any): string[] {
    const refs = modelJSON.FileReferences;
    if (!refs) return [];

    const files: string[] = [];

    if (refs.Moc) files.push(refs.Moc);
    if (refs.DisplayInfo) files.push(refs.DisplayInfo);
    if (refs.Textures) files.push(...refs.Textures);
    if (refs.Physics) files.push(refs.Physics);
    if (refs.Pose) files.push(refs.Pose);
    if (refs.UserData) files.push(refs.UserData);

    if (refs.Expressions) {
      refs.Expressions.forEach((exp: any) => exp.File && files.push(exp.File));
    }

    if (refs.Motions) {
      Object.values(refs.Motions).forEach((motionGroup: any) => {
        if (Array.isArray(motionGroup)) {
          motionGroup.forEach((motion: any) => {
            if (motion.File) files.push(motion.File);
            if (motion.Sound) files.push(motion.Sound);
          });
        }
      });
    }

    return files;
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
      if (
        canvas.width <= 0 ||
        canvas.height <= 0 ||
        width <= 0 ||
        height <= 0
      ) {
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
    signal?: AbortSignal,
  ): Promise<ModelInfo | null> {
    SimpleLive2DManager.initCubism4();
    this.initApp(canvas);
    this.destroyModel();

    try {
      this.checkAborted(signal);

      // 使用新的 findModelConfig 方法，支持用户模型
      const configFileName =
        config.configFile || (await this.findModelConfig(config));
      if (!configFileName) {
        throw new Error("未找到模型配置文件");
      }
      this.checkAborted(signal);

      // 获取配置文件路径和基础目录
      const actualConfigPath = await this.getActualConfigPath(
        config,
        configFileName,
      );
      const modelJSON = JSON.parse(await readTextFile(actualConfigPath));
      this.checkAborted(signal);

      // 确定模型的基础目录（配置文件所在目录）
      let modelBaseDir: string;
      if (config.source === 0) {
        // 预置模型
        if (configFileName.includes("/")) {
          const configDir = configFileName.substring(
            0,
            configFileName.lastIndexOf("/"),
          );
          modelBaseDir = `${config.path}/${configDir}`;
        } else {
          modelBaseDir = config.path;
        }
      } else {
        // 用户模型
        const appDataPath = await appDataDir();
        if (configFileName.includes("/")) {
          const configDir = configFileName.substring(
            0,
            configFileName.lastIndexOf("/"),
          );
          modelBaseDir = `${appDataPath}/${config.path}/${configDir}`;
        } else {
          modelBaseDir = `${appDataPath}/${config.path}`;
        }
      }

      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: convertFileSrc(actualConfigPath),
      });
      this.checkAborted(signal);

      // 使用更新的预处理方法，传入正确的基础目录
      await this.preprocessResourcePaths(
        modelSettings,
        config,
        modelJSON,
        modelBaseDir,
      );
      this.checkAborted(signal);

      this.model = await Live2DModel.from(modelSettings, {
        ticker: Ticker.shared,
      });

      // 模型创建后检查取消
      if (signal?.aborted) {
        this.destroyModel();
        throw new DOMException("加载已取消", "AbortError");
      }

      if (!this.model) {
        throw new Error("模型创建失败");
      }

      this.setupModelTransform(canvas);

      // 清空stage并添加新模型
      if (this.app?.stage) {
        this.app.stage.removeChildren();
        this.app.stage.addChild(this.model);
      }

      return {
        width: this.model.width,
        height: this.model.height,
        motions: (modelSettings.motions || {}) as Record<string, Motion[]>,
        expressions: (modelSettings.expressions || []) as Expression[],
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      Logger.error(
        `SimpleLive2DManager: 加载Live2D模型失败: ${config.name}`,
        String(error),
      );
      throw error;
    }
  }

  /**
   * 调整模型以适应画布尺寸变化
   */
  resize(canvas: HTMLCanvasElement): void {
    if (!this.model || !canvas) return;

    // 更新 PIXI Application 渲染器尺寸
    SimpleLive2DManager.resizeApp(canvas);

    // 重新计算模型变换
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

        if (!this.model.destroyed && typeof this.model.destroy === "function") {
          this.model.destroy({
            children: true,
            texture: true,
            baseTexture: true,
          });
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          Logger.warn("Live2D model destroy warning:", String(error));
        }
      }
      this.model = null;
    }
  }

  /**
   * 暂停渲染（用于 KeepAlive deactivated）
   * 停止 Ticker，释放部分资源但保持状态可恢复
   */
  pause(): void {
    if (this.app) {
      this.app.ticker.stop();
    }
  }

  /**
   * 恢复渲染（用于 KeepAlive activated）
   * 重启 Ticker，恢复渲染
   */
  resume(): void {
    if (this.app) {
      this.app.ticker.start();
    }
  }

  destroy(): void {
    this.destroyModel();

    if (this.canvas) {
      SimpleLive2DManager.destroyApp(this.canvas);
      this.canvas = null;
    }
    this.app = null;

    SimpleLive2DManager.cleanupInactiveApps();
  }
}
