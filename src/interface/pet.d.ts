/**
 * Pet组件系统类型定义
 * 包含模型配置、状态和管理器接口
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

/** 模型状态枚举 */
export type ModelStatus = "loading" | "loaded" | "error" | "idle";

/** 模型类型枚举 */
export type ModelType = "live2d" | "spine" | "vrm";

/** 宠物模型管理器接口 */
export interface PetModelManager {
  /** 加载模型到指定画布 */
  load(
    canvas: HTMLCanvasElement,
    config: ModelConfig,
  ): Promise<ModelInfo | null>;
  /** 销毁当前模型并清理资源 */
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

/** 宠物模型源接口 */
export interface PetModelSource {
  /** 获取所有可用的模型配置列表 */
  getAvailableModels(): Promise<ModelConfig[]>;
  /** 根据模型ID获取特定的模型配置 */
  getModelConfig(modelId: string): Promise<ModelConfig | null>;
}

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
