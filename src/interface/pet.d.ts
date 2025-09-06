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
  motions: Record<string, Motion[]>;
  expressions: Expression[];
}

/** 宠物偏好设置接口 */
export interface PetPreferences {
  /** 是否启用宠物系统 */
  isEnabledPet: boolean;
  /** 默认缩放比例 */
  defaultScale: number;
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
