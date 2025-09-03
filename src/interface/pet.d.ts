/**
 * Pet组件系统类型定义（GlobalData架构版本）
 * 基于GlobalData实现跨webview状态同步的简化版本
 */

/** 模型配置接口 */
export interface ModelConfig {
  name: string;
  path: string;
  configFile?: string;
}

/** 模型信息接口 */
export interface ModelInfo {
  width: number;
  height: number;
  motions: Record<string, any[]>;
  expressions: any[];
}

/** 宠物偏好设置接口 */
export interface PetPreferences {
  /** 是否启用宠物系统 */
  isEnabledPet: boolean;
  /** 默认缩放比例 */
  defaultScale: number;
}

/** 简化的Live2D模型管理器接口 */
export interface SimpleLive2DManagerInterface {
  /** 加载模型到指定画布 */
  load(canvas: HTMLCanvasElement, config: ModelConfig): Promise<ModelInfo | null>;
  /** 销毁当前模型但保留PIXI Application */
  destroyModel(): void;
  /** 完全销毁管理器，包括PIXI Application */
  destroy(): void;
  /** 播放指定分组的动作 */
  playMotion(group: string, index: number): any;
  /** 播放指定索引的表情 */
  playExpression(index: number): any;
  /** 调整模型以适应画布尺寸 */
  resize(canvas: HTMLCanvasElement): void;
  /** 设置模型缩放比例 */
  setModelScale(scale: number): void;
  /** 获取当前模型缩放比例 */
  getModelScale(): number;
  /** 检查模型是否有效且未被销毁 */
  isModelValid(): boolean;
}

// 向后兼容的类型别名（逐步迁移时使用）
/** @deprecated 使用 SimpleLive2DManagerInterface 代替 */
export type PetModelManager = SimpleLive2DManagerInterface;

/** @deprecated 不再需要模型类型枚举，统一使用Live2D */
export type ModelType = "live2d";

/** @deprecated 不再需要模型状态枚举，状态由组件内部管理 */
export type ModelStatus = "loading" | "loaded" | "error" | "idle";

/** @deprecated 工厂模式已移除，不再需要此接口 */
export interface PetModelSource {
  getAvailableModels(): Promise<ModelConfig[]>;
  getModelConfig(modelId: string): Promise<ModelConfig | null>;
}

// 保留的动作和表情接口（Live2D模型配置使用）
/** 动作配置接口 */
export interface Motion {
  File: string;
  Name?: string;
  FadeInTime?: number;
  FadeOutTime?: number;
}

/** 表情配置接口 */
export interface Expression {
  File: string;
  Name?: string;
}
