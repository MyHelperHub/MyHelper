import type {
  ModelConfig,
  PetModelManager,
  PetModelSource,
  ModelType,
} from "@/interface/pet";
import { Logger } from "@/utils/logger";
import { Live2DModelManager } from "./live2d/Live2DModelManager";

/** 宠物模型工厂类 - 负责管理不同类型的模型源和创建对应的模型管理器，采用工厂模式支持多种模型类型扩展 */
export class PetModelFactory {
  /** 注册的模型源映射表，支持多种来源 */
  private readonly modelSources = new Map<string, PetModelSource>();

  /** 注册一个模型源 */
  registerModelSource(sourceType: string, source: PetModelSource): void {
    this.modelSources.set(sourceType, source);
  }

  /** 获取所有已注册模型源的可用模型 */
  async getAvailableModels(): Promise<ModelConfig[]> {
    if (this.modelSources.size === 0) {
      return [];
    }

    const modelPromises = Array.from(this.modelSources.entries()).map(
      async ([sourceType, source]) => {
        try {
          return await source.getAvailableModels();
        } catch (error) {
          Logger.error(`获取模型源 ${sourceType} 失败`, String(error));
          return [];
        }
      }
    );

    const modelArrays = await Promise.all(modelPromises);
    return modelArrays.flat();
  }

  /** 从所有模型源中查找指定ID的模型配置 */
  async getModelConfig(modelId: string): Promise<ModelConfig | null> {
    const configPromises = Array.from(this.modelSources.values()).map(
      async (source) => {
        try {
          return await source.getModelConfig(modelId);
        } catch (error) {
          Logger.error("获取模型配置失败", String(error));
          return null;
        }
      }
    );

    const configs = await Promise.all(configPromises);
    return configs.find(config => config !== null) || null;
  }

  /** 创建指定类型的模型管理器 */
  createModelManager(type: ModelType = "live2d"): PetModelManager {
    switch (type) {
      case "live2d":
        return new Live2DModelManager();
      default:
        throw new Error(`不支持的模型类型: ${type}`);
    }
  }
}

/** 创建宠物模型工厂实例 */
export const createPetModelFactory = () => new PetModelFactory();
