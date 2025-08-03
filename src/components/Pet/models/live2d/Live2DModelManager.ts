import { convertFileSrc } from "@tauri-apps/api/core";
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile, readDir } from "@tauri-apps/plugin-fs";
import { Application, Ticker } from "pixi.js";
import {
  Live2DModel,
  Cubism4ModelSettings,
} from "pixi-live2d-display-lipsyncpatch";
import type { ModelConfig, ModelInfo, PetModelManager } from "@/interface/pet";
import { Logger } from "@/utils/logger";

/** 全局 PIXI Application 管理器，单例模式管理多个画布的应用实例 */
class GlobalAppManager {
  private static instance: GlobalAppManager | null = null;
  private apps: Map<HTMLCanvasElement, Application> = new Map();

  static getInstance(): GlobalAppManager {
    if (!GlobalAppManager.instance) {
      GlobalAppManager.instance = new GlobalAppManager();
    }
    return GlobalAppManager.instance;
  }

  /** 获取或创建指定画布的PIXI应用实例 */
  getApp(canvas: HTMLCanvasElement): Application {
    if (!this.apps.has(canvas)) {
      const app = new Application({
        view: canvas,
        autoStart: true,
        backgroundAlpha: 0,
        resolution: devicePixelRatio,
        resizeTo: canvas,
        // 添加这些配置来避免着色器问题
        antialias: false,
        powerPreference: "high-performance",
      });
      this.apps.set(canvas, app);
    }
    return this.apps.get(canvas)!;
  }

  /** 销毁指定画布的PIXI应用实例 */
  destroyApp(canvas: HTMLCanvasElement) {
    const app = this.apps.get(canvas);
    if (app) {
      try {
        app.destroy();
      } catch (error) {
        // 静默处理销毁错误
      }
      this.apps.delete(canvas);
    }
  }
}

/** Live2D模型管理器，负责模型的加载、渲染和交互控制 */
export class Live2DModelManager implements PetModelManager {
  private app: Application | null = null;
  public model: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private modelScale: number = 0.8;
  private appManager = GlobalAppManager.getInstance();

  /** 初始化PIXI应用实例 */
  private initApp(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas && this.app) return;

    this.canvas = canvas;
    this.app = this.appManager.getApp(canvas);
  }

  /** 自动查找模型配置文件 */
  private async findModelConfig(modelPath: string): Promise<string | null> {
    try {
      const actualPath = await resolveResource(modelPath);
      const files = await readDir(actualPath);

      const configFile = files.find(
        (file) => file.name.endsWith(".model3.json") && file.isFile,
      );

      return configFile ? configFile.name : null;
    } catch (error) {
      Logger.warn("无法读取模型目录", { modelPath, error });
      return null;
    }
  }

  /** 加载Live2D模型到指定画布 */
  async load(
    canvas: HTMLCanvasElement,
    config: ModelConfig,
  ): Promise<ModelInfo | null> {
    this.initApp(canvas);
    this.destroy();

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

      if (this.app?.stage) {
        while (this.app.stage.children.length > 0) {
          this.app.stage.removeChildAt(0);
        }

        this.app.stage.addChild(this.model);
      }

      const result = {
        width: this.model.width,
        height: this.model.height,
        motions: modelSettings.motions || {},
        expressions: modelSettings.expressions || [],
      };

      return result;
    } catch (error) {
      Logger.error(`加载Live2D模型失败: ${config.name}`, error);
      throw error;
    }
  }

  /** 预处理模型资源文件路径，转换为Tauri可用的路径 */
  private async preprocessResourcePaths(
    modelSettings: Cubism4ModelSettings,
    modelPath: string,
    modelJSON: any,
  ) {
    const filePathMap = new Map<string, string>();
    const allFiles = this.collectResourceFiles(modelJSON);

    for (const file of allFiles) {
      if (file) {
        try {
          const resourcePath = `${modelPath}/${file}`;
          const actualFilePath = await resolveResource(resourcePath);
          filePathMap.set(file, convertFileSrc(actualFilePath));
        } catch (error) {
          Logger.error(`无法解析资源文件: ${file}`, error);
        }
      }
    }

    modelSettings.replaceFiles((file, _) => {
      return filePathMap.get(file) || convertFileSrc(`${modelPath}/${file}`);
    });
  }

  /** 收集模型JSON配置中引用的所有资源文件路径 */
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

  /** 设置模型的位置、缩放和锚点变换 */
  private setupModelTransform(canvas: HTMLCanvasElement) {
    if (!this.model) {
      return;
    }

    try {
      // 重要：先重置模型的变换属性
      this.model.scale.set(1);
      this.model.x = 0;
      this.model.y = 0;
      this.model.anchor.set(0.5, 0.5);

      const { width, height } = this.model;

      // 计算合适的缩放比例，确保模型完全显示在画布内
      const scaleX = canvas.width / width;
      const scaleY = canvas.height / height;
      const baseScale = Math.min(scaleX, scaleY) * 0.9; // 留一点边距
      const finalScale = baseScale * this.modelScale;

      // 应用变换
      this.model.scale.set(finalScale);
      this.model.x = canvas.width / 2;
      this.model.y = canvas.height / 2;
    } catch (error) {
      Logger.error("设置模型变换失败", error);
    }
  }

  /** 设置模型缩放比例 */
  setModelScale(scale: number) {
    const newScale = Math.max(0.1, Math.min(2.0, scale));
    this.modelScale = newScale;
    if (this.canvas && this.model) {
      this.setupModelTransform(this.canvas);
    }
  }

  getModelScale(): number {
    return this.modelScale;
  }

  /** 调整模型以适应画布尺寸变化 */
  resize(canvas: HTMLCanvasElement) {
    if (!this.model || !canvas) return;
    this.setupModelTransform(canvas);
  }

  /** 播放指定分组的动作 */
  playMotion(group: string, index: number) {
    return this.model?.motion(group, index);
  }

  /** 播放指定索引的表情 */
  playExpression(index: number) {
    return this.model?.expression(index);
  }

  /** 销毁模型并清理资源 */
  destroy() {
    if (this.model) {
      try {
        // 先从舞台移除模型
        if (this.app?.stage && this.model.parent) {
          this.app.stage.removeChild(this.model);
        }

        // 销毁模型，静默处理WebGL错误
        if (!this.model.destroyed) {
          this.model.destroy();
        }
      } catch (error) {
        // 静默忽略WebGL销毁错误
      }
      this.model = null;
    }

    // 重置缩放比例到默认值
    this.modelScale = 0.8;
  }

  /** 检查模型是否有效且未被销毁 */
  isModelValid(): boolean {
    return this.model && !this.model.destroyed;
  }
}
