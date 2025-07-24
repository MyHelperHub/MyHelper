// 类型定义
export type {
  AnimationTechnology,
  AnimationModel,
  RenderConfig,
  IAnimationRenderer,
  PetDisplayMode,
  PetState,
  DetectionResult,
} from './types';

// 核心组件
export { modelDetector } from './detector';
export { RendererFactory, createRenderer, isRendererSupported, getSupportedRenderers } from './factory';
export { AnimationManager, createAnimationManager } from './manager';

// 渲染器
export { Live2DRenderer } from './renderers/live2d';
export { SpineRenderer } from './renderers/spine';
export { LottieRenderer } from './renderers/lottie';

// Composable
export { usePet, usePetSingleton } from './composables/usePet';
export type { PetComposable } from './composables/usePet';

// Vue组件
export { default as PetWindow } from './components/PetWindow.vue';
export { default as PetInline } from './components/PetInline.vue';

// 常量
export const DESKTOP_PET_VERSION = '1.0.0';
export const SUPPORTED_TECHNOLOGIES = ['live2d', 'spine', 'lottie'] as const;