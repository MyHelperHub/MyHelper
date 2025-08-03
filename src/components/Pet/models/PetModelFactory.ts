import type {
  ModelConfig,
  PetModelManager,
  PetModelSource,
  ModelType,
} from "@/interface/pet";
import { Logger } from "@/utils/logger";
import { Live2DModelManager } from "./live2d/Live2DModelManager";

/**
 * 宠物模型工厂类（单例模式）
 * 负责管理不同类型的模型源和创建对应的模型管理器
 * 采用工厂模式支持多种模型类型扩展
 */
export class PetModelFactory {
  private static instance: PetModelFactory;
  /** 注册的模型源映射表，支持多种来源 */
  private modelSources: Map<string, PetModelSource> = new Map();

  /**
   * 获取工厂单例实例
   */
  static getInstance(): PetModelFactory {
    if (!PetModelFactory.instance) {
      PetModelFactory.instance = new PetModelFactory();
    }
    return PetModelFactory.instance;
  }

  /**
   * 注册一个模型源
   */
  registerModelSource(sourceType: string, source: PetModelSource): void {
    this.modelSources.set(sourceType, source);
  }

  /**
   * 获取所有已注册模型源的可用模型
   */
  async getAvailableModels(): Promise<ModelConfig[]> {
    const allModels: ModelConfig[] = [];

    for (const [sourceType, source] of this.modelSources) {
      try {
        const models = await source.getAvailableModels();
        allModels.push(...models);
      } catch (error) {
        Logger.error(`获取模型源 ${sourceType} 失败`, error);
      }
    }

    return allModels;
  }

  /**
   * 从所有模型源中查找指定ID的模型配置
   */
  async getModelConfig(modelId: string): Promise<ModelConfig | null> {
    for (const [, source] of this.modelSources) {
      try {
        const config = await source.getModelConfig(modelId);
        if (config) return config;
      } catch (error) {
        Logger.error("获取模型配置失败", error);
      }
    }
    return null;
  }

  /**
   * 创建指定类型的模型管理器
   */
  createModelManager(type: ModelType = "live2d"): PetModelManager {
    switch (type) {
      case "live2d":
        return new Live2DModelManager();
      default:
        throw new Error(`不支持的模型类型: ${type}`);
    }
  }
}
