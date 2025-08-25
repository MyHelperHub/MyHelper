import { shallowRef } from "vue";
import type {
  ModelConfig,
  ModelInfo,
  PetModelManager,
  PetPreferences,
} from "@/interface/pet";
import { PetModelFactory } from "@/components/Pet/models/PetModelFactory";
import { ipcGetPetConfig, ipcSetPetConfig } from "@/api/ipc/database.api";
import { Logger } from "../../utils/logger";

/** 宠物管理器 - 负责宠物模型的缓存、状态管理和全局访问 */
class PetManager {
  private static instance: PetManager;
  private modelFactory = PetModelFactory.getInstance();

  private selectedModel = shallowRef<ModelConfig | null>(null);

  private preferences = shallowRef<PetPreferences>({
    isEnabledPet: false,
    defaultScale: 1.0,
  });

  private modelInfoCache = new Map<string, ModelInfo>();

  private isInitialized = false;

  private constructor() {}

  static getInstance(): PetManager {
    if (!PetManager.instance) {
      PetManager.instance = new PetManager();
    }
    return PetManager.instance;
  }

  /** 初始化宠物管理器 */
  async init() {
    if (this.isInitialized) return;

    try {
      const savedPreferences =
        await ipcGetPetConfig<PetPreferences>("preferences");
      if (savedPreferences) {
        this.preferences.value = {
          ...this.preferences.value,
          ...savedPreferences,
        };
      }

      if (!this.preferences.value.isEnabledPet) {
        this.isInitialized = true;
        return;
      }

      const savedModel = await ipcGetPetConfig<ModelConfig>("selected_model");
      if (savedModel) {
        this.selectedModel.value = savedModel;
      }

      this.isInitialized = true;
    } catch (error) {
      Logger.error("PetManager: 初始化失败", String(error));
    }
  }

  /** 获取当前选中的宠物模型 */
  getSelectedModel(): ModelConfig | null {
    return this.selectedModel.value;
  }

  /** 获取选中模型的响应式引用 */
  getSelectedModelRef() {
    return this.selectedModel;
  }

  /** 获取偏好设置 */
  getPreferences(): PetPreferences {
    return this.preferences.value;
  }

  /** 获取偏好设置的响应式引用 */
  getPreferencesRef() {
    return this.preferences;
  }

  /** 设置偏好设置 - 优化错误处理 */
  async setPreferences(newPreferences: Partial<PetPreferences>) {
    try {
      const wasEnabled = this.preferences.value.isEnabledPet;
      this.preferences.value = { ...this.preferences.value, ...newPreferences };
      await ipcSetPetConfig("preferences", this.preferences.value);

      const isNowEnabled = this.preferences.value.isEnabledPet;
      if (!wasEnabled && isNowEnabled) {
        await this.reinitialize();
      }
    } catch (error) {
      Logger.error("PetManager: 设置偏好配置失败", String(error));
      throw error;
    }
  }

  /** 重新初始化宠物管理器 */
  private async reinitialize() {
    if (!this.preferences.value.isEnabledPet) return;

    try {
      const savedModel = await ipcGetPetConfig<ModelConfig>("selected_model");
      if (savedModel) {
        this.selectedModel.value = savedModel;
      }
    } catch (error) {
      Logger.error("PetManager: 重新初始化失败", String(error));
    }
  }

  /** 设置选中的宠物模型 - 优化错误处理和日志 */
  async setSelectedModel(model: ModelConfig | null) {
    try {
      this.selectedModel.value = model;
      await ipcSetPetConfig("selected_model", model);
    } catch (error) {
      Logger.error("PetManager: 设置选中模型失败", String(error));
    }
  }

  /** 获取或创建模型管理器 - 简化逻辑 */
  async getModelManager(): Promise<PetModelManager | null> {
    try {
      const manager = this.modelFactory.createModelManager("live2d");
      return manager;
    } catch (error) {
      Logger.error("PetManager: 创建模型管理器失败", String(error));
      return null;
    }
  }

  /** 缓存模型信息 - 简化为箭头函数 */
  cacheModelInfo = (modelConfig: ModelConfig, modelInfo: ModelInfo) => {
    const cacheKey = `${modelConfig.name}_${modelConfig.path}`;
    this.modelInfoCache.set(cacheKey, modelInfo);
  };

  /** 获取缓存的模型信息 - 简化为箭头函数 */
  getCachedModelInfo = (modelConfig: ModelConfig): ModelInfo | null => {
    const cacheKey = `${modelConfig.name}_${modelConfig.path}`;
    return this.modelInfoCache.get(cacheKey) || null;
  };

  /** 清理模型缓存 - 简化为箭头函数 */
  clearModelCache = (modelConfig: ModelConfig) => {
    const cacheKey = `${modelConfig.name}_${modelConfig.path}`;
    this.modelInfoCache.delete(cacheKey);
  };

  /** 清理所有缓存 - 简化为箭头函数 */
  clearAllCache = () => {
    this.modelInfoCache.clear();
  };

  /** 获取缓存统计信息 - 简化为箭头函数 */
  getCacheStats = () => ({
    infoCount: this.modelInfoCache.size,
    selectedModel: this.selectedModel.value?.name || null,
  });
}

/** 导出单例实例 */
export const petManager = PetManager.getInstance();
export default PetManager;
