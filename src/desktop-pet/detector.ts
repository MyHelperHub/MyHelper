import { invokeApi } from "../api/ipc/wrapper";
import type { AnimationModel, DetectionResult, AnimationTechnology } from "./types";

/**
 * 获取所有动画模型
 */
export const detectAnimationModels = async (): Promise<AnimationModel[]> => {
  return await invokeApi("detect_animation_models");
};

/**
 * 检测模型类型
 * @param modelPath 模型路径
 */
export const detectModelType = async (modelPath: string): Promise<DetectionResult> => {
  return await invokeApi("detect_model_type", { model_path: modelPath });
};

/**
 * 模型检测器类
 */
export class ModelDetector {
  private models: AnimationModel[] = [];
  private initialized = false;

  /**
   * 初始化检测器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.models = await detectAnimationModels();
      this.initialized = true;
    } catch (error) {
      console.error("模型检测器初始化失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有模型
   */
  async getAllModels(): Promise<AnimationModel[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return [...this.models];
  }

  /**
   * 根据技术类型筛选模型
   */
  async getModelsByTechnology(technology: AnimationTechnology): Promise<AnimationModel[]> {
    const allModels = await this.getAllModels();
    return allModels.filter(model => model.technology === technology);
  }

  /**
   * 根据ID获取模型
   */
  async getModelById(id: string): Promise<AnimationModel | undefined> {
    const allModels = await this.getAllModels();
    return allModels.find(model => model.id === id);
  }

  /**
   * 检测指定路径的模型类型
   */
  async detectPath(path: string): Promise<DetectionResult> {
    return await detectModelType(path);
  }

  /**
   * 刷新模型列表
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * 验证模型是否有效
   */
  async validateModel(model: AnimationModel): Promise<boolean> {
    try {
      const result = await this.detectPath(model.path);
      return result.isValid && result.technology === model.technology;
    } catch {
      return false;
    }
  }

  /**
   * 获取Live2D模型列表
   */
  async getLive2DModels(): Promise<AnimationModel[]> {
    return this.getModelsByTechnology('live2d' as AnimationTechnology);
  }

  /**
   * 获取可用的模型技术类型
   */
  async getAvailableTechnologies(): Promise<AnimationTechnology[]> {
    const allModels = await this.getAllModels();
    const technologies = new Set<AnimationTechnology>();
    
    allModels.forEach(model => {
      technologies.add(model.technology);
    });
    
    return Array.from(technologies);
  }
}

// 导出单例实例
export const modelDetector = new ModelDetector();