import { ref, computed, watch, readonly } from 'vue';
import GlobalData from '../../utils/globalData';
import type { PetState, AnimationModel, PetDisplayMode } from '../types';
import { modelDetector } from '../detector';
import { createAnimationManager, type AnimationManager } from '../manager';

// 默认宠物状态
const defaultPetState: PetState = {
  enabled: false,
  displayMode: 'inline',
  windowConfig: {
    x: 100,
    y: 100,
    width: 300,
    height: 400,
    alwaysOnTop: true,
  }
};

// 全局状态
const petState = ref<PetState>({ ...defaultPetState });
const availableModels = ref<AnimationModel[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

// 管理器实例
let animationManager: AnimationManager | null = null;

/**
 * 宠物状态管理 Composable
 */
export function usePet() {
  // 计算属性
  const isEnabled = computed(() => petState.value.enabled);
  const currentModel = computed(() => petState.value.currentModel);
  const displayMode = computed(() => petState.value.displayMode);
  const windowConfig = computed(() => petState.value.windowConfig);

  // 初始化宠物状态
  const initPetState = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      // 从GlobalData获取保存的状态
      const savedState = await GlobalData.get('petState');
      if (savedState) {
        petState.value = { ...defaultPetState, ...savedState };
      }

      // 初始化模型检测器并获取可用模型
      await modelDetector.initialize();
      availableModels.value = await modelDetector.getAllModels();

      console.log('宠物状态初始化完成:', petState.value);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化失败';
      error.value = errorMessage;
      console.error('宠物状态初始化失败:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // 更新宠物状态
  const updatePetState = async (updates: Partial<PetState>): Promise<void> => {
    try {
      const oldState = { ...petState.value };
      petState.value = { ...petState.value, ...updates };
      
      // 持久化到GlobalData
      await GlobalData.set('petState', petState.value);
      
      console.log('宠物状态已更新:', { from: oldState, to: petState.value });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '状态更新失败';
      error.value = errorMessage;
      console.error('更新宠物状态失败:', err);
      throw err;
    }
  };

  // 启用/禁用宠物
  const setPetEnabled = async (enabled: boolean): Promise<void> => {
    await updatePetState({ enabled });
  };

  // 切换宠物启用状态
  const togglePetEnabled = async (): Promise<boolean> => {
    const newState = !petState.value.enabled;
    await setPetEnabled(newState);
    return newState;
  };

  // 设置当前模型
  const setCurrentModel = async (model: AnimationModel | undefined): Promise<void> => {
    await updatePetState({ currentModel: model });
  };

  // 根据模型ID设置当前模型
  const setCurrentModelById = async (modelId: string): Promise<void> => {
    const model = await modelDetector.getModelById(modelId);
    if (!model) {
      throw new Error(`未找到模型: ${modelId}`);
    }
    await setCurrentModel(model);
  };

  // 设置显示模式
  const setDisplayMode = async (mode: PetDisplayMode['type']): Promise<void> => {
    await updatePetState({ displayMode: mode });
  };

  // 切换显示模式
  const toggleDisplayMode = async (): Promise<PetDisplayMode['type']> => {
    const newMode = petState.value.displayMode === 'inline' ? 'window' : 'inline';
    await setDisplayMode(newMode);
    return newMode;
  };

  // 更新窗口配置
  const updateWindowConfig = async (config: Partial<PetState['windowConfig']>): Promise<void> => {
    const currentConfig = petState.value.windowConfig || {
      x: 100,
      y: 100,
      width: 300,
      height: 400,
      alwaysOnTop: true,
    };
    const newWindowConfig = { ...currentConfig, ...config };
    await updatePetState({ windowConfig: newWindowConfig });
  };

  // 刷新可用模型列表
  const refreshModels = async (): Promise<void> => {
    try {
      isLoading.value = true;
      await modelDetector.refresh();
      availableModels.value = await modelDetector.getAllModels();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新模型列表失败';
      error.value = errorMessage;
      console.error('刷新模型列表失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 获取指定技术类型的模型
  const getModelsByTechnology = async (technology: string): Promise<AnimationModel[]> => {
    return await modelDetector.getModelsByTechnology(technology as any);
  };

  // 验证模型有效性
  const validateModel = async (model: AnimationModel): Promise<boolean> => {
    return await modelDetector.validateModel(model);
  };

  // 创建动画管理器
  const createManager = (): AnimationManager => {
    if (animationManager) {
      animationManager.destroy();
    }
    animationManager = createAnimationManager();
    return animationManager;
  };

  // 获取当前动画管理器
  const getManager = (): AnimationManager | null => {
    return animationManager;
  };

  // 销毁动画管理器
  const destroyManager = (): void => {
    if (animationManager) {
      animationManager.destroy();
      animationManager = null;
    }
  };

  // 重置宠物状态
  const resetPetState = async (): Promise<void> => {
    await updatePetState(defaultPetState);
    destroyManager();
  };

  // 获取宠物统计信息
  const getPetStats = computed(() => ({
    totalModels: availableModels.value.length,
    live2dModels: availableModels.value.filter(m => m.technology === 'live2d').length,
    spineModels: availableModels.value.filter(m => m.technology === 'spine').length,
    lottieModels: availableModels.value.filter(m => m.technology === 'lottie').length,
    hasCurrentModel: !!petState.value.currentModel,
    isActive: petState.value.enabled && !!petState.value.currentModel,
  }));

  // 监听状态变化
  watch(() => petState.value.enabled, (newEnabled) => {
    console.log(`宠物${newEnabled ? '启用' : '禁用'}`);
  });

  watch(() => petState.value.displayMode, (newMode, oldMode) => {
    console.log(`显示模式从${oldMode}切换到${newMode}`);
  });

  watch(() => petState.value.currentModel, (newModel, oldModel) => {
    console.log('当前模型变更:', { from: oldModel?.name, to: newModel?.name });
  });

  return {
    // 状态
    petState: readonly(petState),
    availableModels: readonly(availableModels),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // 计算属性
    isEnabled,
    currentModel,
    displayMode,
    windowConfig,
    getPetStats,

    // 方法
    initPetState,
    updatePetState,
    setPetEnabled,
    togglePetEnabled,
    setCurrentModel,
    setCurrentModelById,
    setDisplayMode,
    toggleDisplayMode,
    updateWindowConfig,
    refreshModels,
    getModelsByTechnology,
    validateModel,
    createManager,
    getManager,
    destroyManager,
    resetPetState,
  };
}

// 导出单例实例
let petComposable: ReturnType<typeof usePet> | null = null;

export const usePetSingleton = (): ReturnType<typeof usePet> => {
  if (!petComposable) {
    petComposable = usePet();
  }
  return petComposable;
};

// 类型导出
export type PetComposable = ReturnType<typeof usePet>;