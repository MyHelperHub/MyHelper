/**
 * Pet组件系统统一导出
 * 提供高内聚低耦合的宠物显示和管理功能
 */

/** 主要组件导出 */
export { default as Pet } from "./Pet.vue";
export { default as PetDisplay } from "./PetDisplay.vue";
export { default as PetSelector } from "./PetSelector.vue";
export { default as PetList } from "./PetList.vue";

/** 模型工厂和类导出 */
export * from "./models/PetModelFactory";

/** 类型定义导出 */
export type * from "@/interface/pet";
