import type { ModelConfig, PetModelSource } from "@/interface/pet";

/**
 * 基于本地资源的模型源实现
 * 管理存储在应用资源目录中的Live2D模型配置
 */
export class AssetsModelSource implements PetModelSource {
  private models: ModelConfig[] = [];

  constructor(models: ModelConfig[] = []) {
    this.models = models;
  }

  /** 获取所有可用的模型配置 */
  async getAvailableModels(): Promise<ModelConfig[]> {
    return [...this.models];
  }

  /** 根据模型名称查找特定的模型配置 */
  async getModelConfig(modelId: string): Promise<ModelConfig | null> {
    return this.models.find((model) => model.name === modelId) || null;
  }

  /** 添加或更新模型配置 */
  addModel(model: ModelConfig): void {
    const existingIndex = this.models.findIndex((m) => m.name === model.name);
    if (existingIndex >= 0) {
      this.models[existingIndex] = model;
    } else {
      this.models.push(model);
    }
  }

  /** 移除指定名称的模型配置 */
  removeModel(modelName: string): void {
    this.models = this.models.filter((model) => model.name !== modelName);
  }
}

/** 预定义的资源模型配置列表，采用硬编码方式确保高性能 */
export const DEFAULT_ASSETS_MODELS: ModelConfig[] = [
  {
    name: "Simple模型",
    path: "assets/models/live2d/simple/runtime",
    configFile: "simple.model3.json",
  },
  {
    name: "Mark Free 中文版",
    path: "assets/models/live2d/mark_free_zh/runtime",
    configFile: "mark_free_t04.model3.json",
  },
];
