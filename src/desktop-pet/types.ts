export enum AnimationTechnology {
  LIVE2D = 'live2d',
  SPINE = 'spine', 
  LOTTIE = 'lottie',
  UNKNOWN = 'unknown'
}

export interface AnimationModel {
  id: string;
  name: string;
  technology: AnimationTechnology;
  path: string;
  preview?: string;
  metadata?: Record<string, any>;
}

export interface RenderConfig {
  width: number;
  height: number;
  scale?: number;
  interactive?: boolean;
}

export interface IAnimationRenderer {
  init(container: HTMLElement, config: RenderConfig): Promise<void>;
  loadModel(modelPath: string): Promise<void>;
  play(motionName?: string): void;
  pause(): void;
  setScale(scale: number): void;
  setInteractive(interactive: boolean): void;
  onModelClick?: (callback: () => void) => void;
  destroy(): void;
}

export interface PetDisplayMode {
  type: 'window' | 'inline';
  config: RenderConfig;
}

export interface PetState {
  enabled: boolean;
  currentModel?: AnimationModel;
  displayMode: PetDisplayMode['type'];
  windowConfig?: {
    x: number;
    y: number;
    width: number;
    height: number;
    alwaysOnTop: boolean;
  };
}

export interface DetectionResult {
  technology: AnimationTechnology;
  isValid: boolean;
  error?: string;
  metadata?: Record<string, any>;
}