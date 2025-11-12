import { ref, Ref } from "vue";
import { emit as tauriEmit, listen } from "@tauri-apps/api/event";
import GlobalData from "@/utils/globalData";
import type { ModelConfig, PetPreferences } from "@/types/pet";
import { Logger } from "@/utils/logger";
import { ipcGetPetConfig, ipcSetPetConfig } from "@/api/ipc/database.api";
import { resolveResource } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/plugin-fs";

/** 全局数据键名常量 */
const GLOBAL_KEYS = {
  SELECTED_PET_MODEL: "selectedPetModel",
  PET_MODEL_CACHE: "petModelCache",
  PET_PREFERENCES: "petPreferences",
} as const;

/** Tauri事件名常量 */
const TAURI_EVENTS = {
  MODEL_CHANGED: "pet:model-changed",
  PREFERENCES_CHANGED: "pet:preferences-changed",
} as const;

/** 默认宠物偏好设置 */
const DEFAULT_PREFERENCES: PetPreferences = {
  isEnabledPet: false,
  defaultScale: 1.0,
};

/** 宠物全局管理器 */
export class PetGlobalManager {
  private static isInitialized = false;
  private static initPromise: Promise<void> | null = null;
  private static modelStateLoaded = false;

  /** 初始化全局宠物管理器 */
  static async init(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInit();
    return this.initPromise;
  }

  private static async performInit(): Promise<void> {
    try {
      // 从数据库加载偏好设置
      const savedPreferences =
        await ipcGetPetConfig<PetPreferences>("preferences");
      const preferences = savedPreferences
        ? { ...DEFAULT_PREFERENCES, ...savedPreferences }
        : DEFAULT_PREFERENCES;

      await GlobalData.set(GLOBAL_KEYS.PET_PREFERENCES, preferences);

      if (preferences.isEnabledPet) {
        await this.ensureModelStateLoaded();
      } else {
        this.modelStateLoaded = false;
      }

      this.isInitialized = true;
    } catch (error) {
      Logger.error("PetGlobalManager: 初始化失败", String(error));
      throw error;
    }
  }

  private static async ensureModelStateLoaded(): Promise<void> {
    if (this.modelStateLoaded) return;

    const preferences = ((await GlobalData.get(GLOBAL_KEYS.PET_PREFERENCES)) ||
      DEFAULT_PREFERENCES) as PetPreferences;
    if (!preferences.isEnabledPet) {
      return;
    }

    try {
      const savedModel = await ipcGetPetConfig<ModelConfig>("selectedModel");
      if (savedModel) {
        await GlobalData.set(GLOBAL_KEYS.SELECTED_PET_MODEL, savedModel);
      } else {
        await GlobalData.set(GLOBAL_KEYS.SELECTED_PET_MODEL, null);
      }

      this.modelStateLoaded = true;
    } catch (error) {
      Logger.warn("PetGlobalManager: 加载宠物模型状态失败", String(error));
    }
  }

  /**
   * 创建响应式的选中模型引用
   * 监听Tauri事件来更新本地状态
   */
  static createSelectedModelRef(): {
    ref: Ref<ModelConfig | null>;
    cleanup: () => void;
  } {
    const modelRef = ref<ModelConfig | null>(null);
    let unlistenFn: (() => void) | null = null;

    // 初始化时从GlobalData加载
    this.init()
      .then(async () => {
        unlistenFn = await listen<{ model: ModelConfig | null }>(
          TAURI_EVENTS.MODEL_CHANGED,
          (event) => {
            modelRef.value = event.payload.model;
          },
        );

        const preferences = (await GlobalData.get(
          GLOBAL_KEYS.PET_PREFERENCES,
        )) as PetPreferences | null;

        if (!preferences || !preferences.isEnabledPet) {
          modelRef.value = null;
          return;
        }

        await this.ensureModelStateLoaded();
        modelRef.value = await GlobalData.get(GLOBAL_KEYS.SELECTED_PET_MODEL);
      })
      .catch((error) => {
        Logger.error("PetGlobalManager: 监听模型变化事件失败", String(error));
      });

    const cleanup = () => {
      if (unlistenFn) {
        unlistenFn();
        unlistenFn = null;
      }
    };

    return { ref: modelRef, cleanup };
  }

  /**
   * 创建响应式的偏好设置引用
   */
  static createPreferencesRef(): {
    ref: Ref<PetPreferences>;
    cleanup: () => void;
  } {
    const preferencesRef = ref<PetPreferences>(DEFAULT_PREFERENCES);
    let unlistenFn: (() => void) | null = null;

    // 初始化时从GlobalData加载
    this.init()
      .then(async () => {
        const initialPreferences = await GlobalData.get(
          GLOBAL_KEYS.PET_PREFERENCES,
        );
        preferencesRef.value = initialPreferences || DEFAULT_PREFERENCES;

        // 监听Tauri事件更新，保存 unlisten 函数
        unlistenFn = await listen<PetPreferences>(
          TAURI_EVENTS.PREFERENCES_CHANGED,
          (event) => {
            preferencesRef.value = {
              ...preferencesRef.value,
              ...event.payload,
            };
          },
        );
      })
      .catch((error) => {
        Logger.error(
          "PetGlobalManager: 监听偏好设置变化事件失败",
          String(error),
        );
      });

    const cleanup = () => {
      if (unlistenFn) {
        unlistenFn();
        unlistenFn = null;
      }
    };

    return { ref: preferencesRef, cleanup };
  }

  /**
   * 设置选中的宠物模型
   */
  static async setSelectedModel(model: ModelConfig | null): Promise<void> {
    try {
      // 1. 更新GlobalData
      await GlobalData.set(GLOBAL_KEYS.SELECTED_PET_MODEL, model);
      this.modelStateLoaded = true;

      // 2. 持久化到数据库
      await ipcSetPetConfig("selectedModel", model);

      // 3. 发送Tauri事件通知所有webview
      await tauriEmit(TAURI_EVENTS.MODEL_CHANGED, { model });
    } catch (error) {
      Logger.error("PetGlobalManager: 设置选中模型失败", String(error));
      throw error;
    }
  }

  /**
   * 更新宠物偏好设置
   */
  static async updatePreferences(
    updates: Partial<PetPreferences>,
  ): Promise<void> {
    try {
      const currentPreferences =
        (await GlobalData.get(GLOBAL_KEYS.PET_PREFERENCES)) ||
        DEFAULT_PREFERENCES;
      const newPreferences = { ...currentPreferences, ...updates };
      const wasEnabled = currentPreferences.isEnabledPet;
      const willEnable = newPreferences.isEnabledPet;

      // 1. 更新GlobalData
      await GlobalData.set(GLOBAL_KEYS.PET_PREFERENCES, newPreferences);

      // 2. 持久化到数据库
      await ipcSetPetConfig("preferences", newPreferences);

      // 3. 发送Tauri事件通知所有webview
      await tauriEmit(TAURI_EVENTS.PREFERENCES_CHANGED, updates);

      if (!wasEnabled && willEnable) {
        // 从禁用变为启用，需要加载模型状态并通知所有监听器
        this.modelStateLoaded = false;
        await this.ensureModelStateLoaded();

        // 发送 MODEL_CHANGED 事件，触发所有监听器更新
        const model = await GlobalData.get(GLOBAL_KEYS.SELECTED_PET_MODEL);
        await tauriEmit(TAURI_EVENTS.MODEL_CHANGED, { model });
      } else if (wasEnabled && !willEnable) {
        this.modelStateLoaded = false;
      }
    } catch (error) {
      Logger.error("PetGlobalManager: 更新偏好设置失败", String(error));
      throw error;
    }
  }

  /**
   * 获取模型缓存列表
   */
  static async getModelCache(): Promise<ModelConfig[]> {
    try {
      const cache = await GlobalData.get(GLOBAL_KEYS.PET_MODEL_CACHE);
      return cache || [];
    } catch (error) {
      Logger.error("PetGlobalManager: 获取模型缓存失败", String(error));
      return [];
    }
  }

  /**
   * 刷新模型缓存
   */
  static async refreshModelCache(): Promise<ModelConfig[]> {
    try {
      const models: ModelConfig[] = [];

      try {
        const modelsPath = await resolveResource("assets/models/live2d");
        const entries = await readDir(modelsPath);

        for (const entry of entries) {
          if (entry.isDirectory) {
            try {
              const modelDir = `${modelsPath}/${entry.name}`;
              const modelFiles = await readDir(modelDir);

              // 检查支持的模型文件类型：Cubism 2.1, 3.x, 4.x
              const supportedModelFiles = [
                ".model.json", // Cubism 2.1
                ".model3.json", // Cubism 3.x
                ".model4.json", // Cubism 4.x
              ];

              let hasModelFile = modelFiles.some((file) =>
                supportedModelFiles.some((ext) => file.name.endsWith(ext)),
              );
              let modelPath = `assets/models/live2d/${entry.name}`;

              // 如果根目录没有，检查runtime子目录
              if (!hasModelFile) {
                const runtimeDir = modelFiles.find(
                  (file) => file.isDirectory && file.name === "runtime",
                );
                if (runtimeDir) {
                  try {
                    const runtimePath = `${modelDir}/runtime`;
                    const runtimeFiles = await readDir(runtimePath);
                    hasModelFile = runtimeFiles.some((file) =>
                      supportedModelFiles.some((ext) =>
                        file.name.endsWith(ext),
                      ),
                    );
                    if (hasModelFile) {
                      modelPath = `assets/models/live2d/${entry.name}/runtime`;
                    }
                  } catch (runtimeError) {
                    Logger.warn(
                      `PetGlobalManager: 检查runtime目录失败 ${entry.name}`,
                      String(runtimeError),
                    );
                  }
                }
              }

              if (hasModelFile) {
                models.push({
                  name: entry.name,
                  path: modelPath,
                  source: 0, // 预置模型
                });
              }
            } catch (error) {
              Logger.warn(
                `PetGlobalManager: 检查模型目录失败 ${entry.name}`,
                String(error),
              );
            }
          }
        }
      } catch (error) {
        Logger.warn("PetGlobalManager: 读取模型目录失败", String(error));
      }

      // 获取用户导入的模型
      try {
        const { ipcGetAllLive2DModels } = await import("@/api/ipc/pet.api");
        const allModels = (await ipcGetAllLive2DModels()) as ModelConfig[];
        // 只添加用户导入的模型（source: 1）
        const userModels = allModels.filter(
          (model: ModelConfig) => model.source === 1,
        );
        models.push(...userModels);
      } catch (error) {
        Logger.warn("PetGlobalManager: 获取用户模型失败", String(error));
      }

      // 更新缓存
      await GlobalData.set(GLOBAL_KEYS.PET_MODEL_CACHE, models);
      return models;
    } catch (error) {
      Logger.error("PetGlobalManager: 刷新模型缓存失败", String(error));
      return [];
    }
  }

  /**
   * 获取当前选中的模型（非响应式）
   */
  static async getSelectedModel(): Promise<ModelConfig | null> {
    try {
      const preferences = ((await GlobalData.get(
        GLOBAL_KEYS.PET_PREFERENCES,
      )) || DEFAULT_PREFERENCES) as PetPreferences;
      if (!preferences.isEnabledPet) {
        return null;
      }

      await this.ensureModelStateLoaded();
      return await GlobalData.get(GLOBAL_KEYS.SELECTED_PET_MODEL);
    } catch (error) {
      Logger.error("PetGlobalManager: 获取选中模型失败", String(error));
      return null;
    }
  }

  /**
   * 获取宠物偏好设置（非响应式）
   */
  static async getPreferences(): Promise<PetPreferences> {
    try {
      const preferences = await GlobalData.get(GLOBAL_KEYS.PET_PREFERENCES);
      return preferences || DEFAULT_PREFERENCES;
    } catch (error) {
      Logger.error("PetGlobalManager: 获取偏好设置失败", String(error));
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * 导入 Live2D 模型
   */
  static async importModel(
    filePath: string,
    modelName?: string,
  ): Promise<string> {
    try {
      const { ipcImportLive2DModel } = await import("@/api/ipc/pet.api");
      const result = (await ipcImportLive2DModel(
        filePath,
        modelName,
      )) as string;

      // 导入成功后刷新模型缓存
      await this.refreshModelCache();

      return result;
    } catch (error) {
      Logger.error(error, "PetGlobalManager.importModel 完整错误对象:");
      const errorStr =
        error instanceof Error ? error.message : JSON.stringify(error, null, 2);
      Logger.error(
        "PetGlobalManager: 导入模型失败",
        `错误类型: ${typeof error}, 错误内容: ${errorStr}`,
      );
      throw error;
    }
  }

  /**
   * 删除用户导入的模型
   */
  static async deleteUserModel(modelName: string): Promise<void> {
    try {
      const { ipcDeleteUserLive2DModel } = await import("@/api/ipc/pet.api");
      await ipcDeleteUserLive2DModel(modelName);

      // 删除成功后刷新模型缓存
      await this.refreshModelCache();

      // 如果删除的是当前选中的模型，则清除选中状态
      const currentModel = await this.getSelectedModel();
      if (
        currentModel &&
        currentModel.name === modelName &&
        currentModel.source === 1
      ) {
        await this.setSelectedModel(null);
      }
    } catch (error) {
      Logger.error("PetGlobalManager: 删除用户模型失败", String(error));
      throw error;
    }
  }

  /**
   * 获取所有模型（包含预置和用户导入）
   */
  static async getAllModels(): Promise<ModelConfig[]> {
    try {
      return await this.refreshModelCache();
    } catch (error) {
      Logger.error("PetGlobalManager: 获取所有模型失败", String(error));
      return [];
    }
  }
}
