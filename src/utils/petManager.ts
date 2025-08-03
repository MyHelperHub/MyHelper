import { shallowRef } from "vue";
import type { ModelConfig, ModelInfo, PetModelManager } from "@/interface/pet";
import { PetModelFactory } from "@/components/Pet/models/PetModelFactory";
import GlobalData from "./globalData";
import { Logger } from "./logger";

/**
 * 宠物管理器
 * 负责宠物模型的缓存、状态管理和全局访问
 */
class PetManager {
  private static instance: PetManager;
  private modelFactory = PetModelFactory.getInstance();
  
  // 当前选中的宠物模型配置（响应式）
  private selectedModel = shallowRef<ModelConfig | null>(null);
  
  // 移除模型管理器缓存，避免WebGL上下文冲突
  
  // 模型信息缓存
  private modelInfoCache = new Map<string, ModelInfo>();
  
  // 初始化状态
  private isInitialized = false;

  private constructor() {}

  static getInstance(): PetManager {
    if (!PetManager.instance) {
      PetManager.instance = new PetManager();
    }
    return PetManager.instance;
  }

  /**
   * 初始化宠物管理器
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // 从全局数据中恢复选中的模型
      const savedModel = await GlobalData.get("selectedPetModel");
      if (savedModel) {
        this.selectedModel.value = savedModel;
        Logger.info("PetManager: 恢复选中的宠物模型", savedModel.name);
      }

      // 恢复模型信息缓存
      const savedModelInfoCache = await GlobalData.get("petModelInfoCache");
      if (savedModelInfoCache) {
        this.modelInfoCache = new Map(Object.entries(savedModelInfoCache));
        Logger.info("PetManager: 恢复模型信息缓存", this.modelInfoCache.size);
      }

      this.isInitialized = true;
      Logger.info("PetManager: 初始化完成");
    } catch (error) {
      Logger.error("PetManager: 初始化失败", error);
    }
  }

  /**
   * 获取当前选中的宠物模型
   */
  getSelectedModel(): ModelConfig | null {
    return this.selectedModel.value;
  }

  /**
   * 获取选中模型的响应式引用
   */
  getSelectedModelRef() {
    return this.selectedModel;
  }

  /**
   * 设置选中的宠物模型
   */
  async setSelectedModel(model: ModelConfig | null) {
    try {
      this.selectedModel.value = model;
      
      // 持久化保存
      await GlobalData.set("selectedPetModel", model);
      
      Logger.info("PetManager: 设置选中模型", model?.name || "null");
    } catch (error) {
      Logger.error("PetManager: 设置选中模型失败", error);
    }
  }

  /**
   * 获取或创建模型管理器
   * 注意：为了避免WebGL上下文冲突，不再缓存管理器实例
   */
  async getModelManager(modelConfig: ModelConfig): Promise<PetModelManager | null> {
    // 每次都创建新的管理器，避免WebGL上下文冲突
    try {
      const manager = this.modelFactory.createModelManager("live2d");
      Logger.info("PetManager: 创建新的模型管理器", modelConfig.name);
      return manager;
    } catch (error) {
      Logger.error("PetManager: 创建模型管理器失败", error);
      return null;
    }
  }

  /**
   * 缓存模型信息
   */
  async cacheModelInfo(modelConfig: ModelConfig, modelInfo: ModelInfo) {
    const cacheKey = this.getModelCacheKey(modelConfig);
    this.modelInfoCache.set(cacheKey, modelInfo);
    
    try {
      // 持久化保存模型信息缓存
      const cacheObject = Object.fromEntries(this.modelInfoCache.entries());
      await GlobalData.set("petModelInfoCache", cacheObject);
      Logger.info("PetManager: 缓存模型信息", modelConfig.name);
    } catch (error) {
      Logger.error("PetManager: 缓存模型信息失败", error);
    }
  }

  /**
   * 获取缓存的模型信息
   */
  getCachedModelInfo(modelConfig: ModelConfig): ModelInfo | null {
    const cacheKey = this.getModelCacheKey(modelConfig);
    return this.modelInfoCache.get(cacheKey) || null;
  }

  /**
   * 清理指定模型的缓存
   */
  clearModelCache(modelConfig: ModelConfig) {
    const cacheKey = this.getModelCacheKey(modelConfig);
    
    // 清理模型信息缓存
    this.modelInfoCache.delete(cacheKey);
    
    Logger.info("PetManager: 清理模型缓存", modelConfig.name);
  }

  /**
   * 清理所有缓存
   */
  async clearAllCache() {
    // 清理模型信息缓存
    this.modelInfoCache.clear();
    
    // 清理持久化数据
    try {
      await GlobalData.delete("petModelInfoCache");
      Logger.info("PetManager: 清理所有缓存完成");
    } catch (error) {
      Logger.error("PetManager: 清理缓存失败", error);
    }
  }

  /**
   * 生成模型缓存键
   */
  private getModelCacheKey(modelConfig: ModelConfig): string {
    return `${modelConfig.name}_${modelConfig.path}`;
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    return {
      infoCount: this.modelInfoCache.size,
      selectedModel: this.selectedModel.value?.name || null,
    };
  }
}

// 导出单例实例
export const petManager = PetManager.getInstance();
export default PetManager;