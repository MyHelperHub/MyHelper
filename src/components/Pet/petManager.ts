import { ref, shallowRef } from "vue";
import { emit as tauriEmit } from "@tauri-apps/api/event";
import type {
  ModelConfig,
  ModelType,
  PetModelManager,
  PetPreferences,
} from "@/interface/pet";
import { createPetModelFactory } from "@/components/Pet/models/PetModelFactory";
import { ipcGetPetConfig, ipcSetPetConfig } from "@/api/ipc/database.api";
import { Logger } from "../../utils/logger";

/** 宠物管理器 - 负责宠物模型的状态管理和数据持久化 */
class PetManager {
  private readonly modelFactory = createPetModelFactory();
  private readonly selectedModel = shallowRef<ModelConfig | null>(null);
  private readonly preferences = shallowRef<PetPreferences>({
    isEnabledPet: false,
    defaultScale: 1.0,
  });
  private readonly isInitialized = ref(false);
  
  private initPromise?: Promise<void>;

  /** 初始化宠物管理器 */
  async init(): Promise<void> {
    if (this.isInitialized.value) return;
    
    // 避免并发初始化
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.performInit();
    return this.initPromise;
  }
  
  private async performInit(): Promise<void> {
    try {
      const [savedPreferences, savedModel] = await Promise.all([
        ipcGetPetConfig<PetPreferences>("preferences"),
        ipcGetPetConfig<ModelConfig>("selected_model")
      ]);

      if (savedPreferences) {
        this.preferences.value = { ...this.preferences.value, ...savedPreferences };
      }

      if (savedModel && this.preferences.value.isEnabledPet) {
        this.selectedModel.value = savedModel;
      }

      this.isInitialized.value = true;
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

  /** 设置偏好设置 */
  async setPreferences(newPreferences: Partial<PetPreferences>): Promise<void> {
    const updatedPreferences = { ...this.preferences.value, ...newPreferences };
    
    try {
      // 先更新响应式状态，再持久化
      this.preferences.value = updatedPreferences;
      
      const tasks: Promise<any>[] = [ipcSetPetConfig("preferences", updatedPreferences)];
      
      if (newPreferences.isEnabledPet && !this.selectedModel.value) {
        tasks.push(
          ipcGetPetConfig<ModelConfig>("selected_model").then(savedModel => {
            if (savedModel) {
              this.selectedModel.value = savedModel;
            }
          })
        );
      }
      
      await Promise.all(tasks);
      
      // 发送宠物偏好设置更改事件
      await tauriEmit("pet:preferences-changed", updatedPreferences);
      
      if (newPreferences.isEnabledPet !== undefined) {
        await tauriEmit("pet:enabled-changed", { enabled: newPreferences.isEnabledPet });
      }
      
    } catch (error) {
      // 回滚状态
      this.preferences.value = { ...this.preferences.value };
      Logger.error("PetManager: 设置偏好配置失败", String(error));
      throw error;
    }
  }


  /** 设置选中的宠物模型 */
  async setSelectedModel(model: ModelConfig | null): Promise<void> {
    const previousModel = this.selectedModel.value;
    
    try {
      this.selectedModel.value = model;
      await ipcSetPetConfig("selected_model", model);
      
      // 发送模型更改事件
      await tauriEmit("pet:model-changed", { model });
      
    } catch (error) {
      // 回滚状态
      this.selectedModel.value = previousModel;
      Logger.error("PetManager: 设置选中模型失败", String(error));
      throw error;
    }
  }

  /** 获取或创建模型管理器 */
  getModelManager(type: ModelType = "live2d"): PetModelManager {
    return this.modelFactory.createModelManager(type);
  }
}

/** 创建宠物管理器实例 */
export const createPetManager = () => new PetManager();

/** 导出默认实例用于向后兼容 */
export const petManager = createPetManager();
export default PetManager;
