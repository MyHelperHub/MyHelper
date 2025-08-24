import { shallowRef } from "vue";
import type { ModelConfig, ModelInfo, PetModelManager, PetPreferences } from "@/interface/pet";
import { PetModelFactory } from "@/components/Pet/models/PetModelFactory";
import { ipcGetPetConfig, ipcSetPetConfig } from "@/api/ipc/database.api";
import { Logger } from "../../utils/logger";

/**
 * 宠物管理器
 * 负责宠物模型的缓存、状态管理和全局访问
 */
class PetManager {
  private static instance: PetManager;
  private modelFactory = PetModelFactory.getInstance();

  // 当前选中的宠物模型配置（响应式）
  private selectedModel = shallowRef<ModelConfig | null>(null);

  // 宠物偏好设置（响应式）
  private preferences = shallowRef<PetPreferences>({
    enableAsAvatar: false,
    defaultScale: 1.0,
    lastUsedModels: [],
    autoLoad: true,
  });

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
      // 从数据库恢复选中的模型
      const savedModel = await ipcGetPetConfig<ModelConfig>("selected_model");
      if (savedModel) {
        this.selectedModel.value = savedModel;
        Logger.info("PetManager: 从数据库恢复选中的宠物模型", savedModel.name);
      }

      // 从数据库恢复偏好设置
      const savedPreferences = await ipcGetPetConfig<PetPreferences>("preferences");
      if (savedPreferences) {
        this.preferences.value = { ...this.preferences.value, ...savedPreferences };
        Logger.info("PetManager: 从数据库恢复偏好设置", JSON.stringify(savedPreferences));
      }

      // 注意: modelInfoCache 不再持久化存储，仅作为运行时内存缓存
      Logger.info("PetManager: 模型信息缓存将根据需要从文件读取");

      this.isInitialized = true;
      Logger.info("PetManager: 初始化完成");
    } catch (error) {
      Logger.error("PetManager: 初始化失败", String(error));
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
   * 获取偏好设置
   */
  getPreferences(): PetPreferences {
    return this.preferences.value;
  }

  /**
   * 获取偏好设置的响应式引用
   */
  getPreferencesRef() {
    return this.preferences;
  }

  /**
   * 设置偏好设置 - 优化错误处理
   */
  async setPreferences(newPreferences: Partial<PetPreferences>) {
    try {
      this.preferences.value = { ...this.preferences.value, ...newPreferences };
      await ipcSetPetConfig("preferences", this.preferences.value);
      Logger.info("PetManager: 设置偏好配置到数据库", JSON.stringify(newPreferences));
    } catch (error) {
      Logger.error("PetManager: 设置偏好配置失败", String(error));
    }
  }

  /**
   * 设置是否启用宠物作为头像 - 简化为箭头函数
   */
  setEnableAsAvatar = (enabled: boolean) => this.setPreferences({ enableAsAvatar: enabled });

  /**
   * 获取是否启用宠物作为头像 - 简化为箭头函数
   */
  isEnabledAsAvatar = () => this.preferences.value.enableAsAvatar;

  /**
   * 设置选中的宠物模型 - 优化错误处理和日志
   */
  async setSelectedModel(model: ModelConfig | null) {
    try {
      this.selectedModel.value = model;
      await ipcSetPetConfig("selected_model", model);
      Logger.info("PetManager: 设置选中模型", JSON.stringify(model));
    } catch (error) {
      Logger.error("PetManager: 设置选中模型失败", String(error));
    }
  }

  /**
   * 获取或创建模型管理器 - 简化逻辑
   */
  async getModelManager(modelConfig: ModelConfig): Promise<PetModelManager | null> {
    try {
      const manager = this.modelFactory.createModelManager("live2d");
      Logger.info("PetManager: 创建新的模型管理器", JSON.stringify(modelConfig));
      return manager;
    } catch (error) {
      Logger.error("PetManager: 创建模型管理器失败", String(error));
      return null;
    }
  }

  /**
   * 缓存模型信息 - 简化为箭头函数
   */
  cacheModelInfo = (modelConfig: ModelConfig, modelInfo: ModelInfo) => {
    const cacheKey = `${modelConfig.name}_${modelConfig.path}`;
    this.modelInfoCache.set(cacheKey, modelInfo);
    Logger.info("PetManager: 缓存模型信息到内存", modelConfig.name);
  };

  /**
   * 获取缓存的模型信息 - 简化为箭头函数
   */
  getCachedModelInfo = (modelConfig: ModelConfig): ModelInfo | null => {
    const cacheKey = `${modelConfig.name}_${modelConfig.path}`;
    return this.modelInfoCache.get(cacheKey) || null;
  };

  /**
   * 清理模型缓存 - 简化为箭头函数
   */
  clearModelCache = (modelConfig: ModelConfig) => {
    const cacheKey = `${modelConfig.name}_${modelConfig.path}`;
    this.modelInfoCache.delete(cacheKey);
    Logger.info("PetManager: 清理模型缓存", modelConfig.name);
  };

  /**
   * 清理所有缓存 - 简化为箭头函数
   */
  clearAllCache = () => {
    this.modelInfoCache.clear();
    Logger.info("PetManager: 清理内存缓存完成");
  };

  /**
   * 获取缓存统计信息 - 简化为箭头函数
   */
  getCacheStats = () => ({
    infoCount: this.modelInfoCache.size,
    selectedModel: this.selectedModel.value?.name || null,
  });
}

// 导出单例实例
export const petManager = PetManager.getInstance();
export default PetManager;
