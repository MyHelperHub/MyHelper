import { ref } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import { resolveResource } from '@tauri-apps/api/path'
import { readTextFile, readDir } from '@tauri-apps/plugin-fs'
import { Application, Ticker } from 'pixi.js'
import { Live2DModel, Cubism4ModelSettings } from 'pixi-live2d-display-lipsyncpatch'

// 注册Ticker
Live2DModel.registerTicker(Ticker)

// 模型配置接口
export interface ModelConfig {
  name: string
  path: string
  configFile?: string
}

// 模型信息接口
export interface ModelInfo {
  width: number
  height: number
  motions: Record<string, any[]>
  expressions: any[]
}

// 全局 PIXI Application 管理器
class GlobalAppManager {
  private static instance: GlobalAppManager | null = null
  private apps: Map<HTMLCanvasElement, Application> = new Map()

  static getInstance(): GlobalAppManager {
    if (!GlobalAppManager.instance) {
      GlobalAppManager.instance = new GlobalAppManager()
    }
    return GlobalAppManager.instance
  }

  getApp(canvas: HTMLCanvasElement): Application {
    if (!this.apps.has(canvas)) {
      const app = new Application({
        view: canvas,
        autoStart: true,
        backgroundAlpha: 0,
        resolution: devicePixelRatio,
      })
      this.apps.set(canvas, app)
      console.log('GlobalAppManager: 为画布创建新的 PIXI Application')
    }
    return this.apps.get(canvas)!
  }

  destroyApp(canvas: HTMLCanvasElement) {
    const app = this.apps.get(canvas)
    if (app) {
      try {
        app.destroy()
        console.log('GlobalAppManager: PIXI Application 已销毁')
      } catch (error) {
        console.warn('GlobalAppManager: 销毁 PIXI Application 时出现警告:', error)
      }
      this.apps.delete(canvas)
    }
  }
}

// Live2D管理类
class Live2DManager {
  private app: Application | null = null
  public model: any = null
  private canvas: HTMLCanvasElement | null = null
  private modelScale: number = 0.8 // 默认缩放比例
  private appManager = GlobalAppManager.getInstance()

  constructor() {}

  // 初始化应用
  private initApp(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas && this.app) return

    this.canvas = canvas
    this.app = this.appManager.getApp(canvas)
    console.log('Live2DManager: 获取 PIXI Application')
  }

  // 自动发现模型配置文件
  private async findModelConfig(modelPath: string): Promise<string | null> {
    try {
      const actualPath = await resolveResource(modelPath)
      const files = await readDir(actualPath)
      
      // 查找 .model3.json 文件
      const configFile = files.find(file => 
        file.name.endsWith('.model3.json') && file.isFile
      )
      
      return configFile ? configFile.name : null
    } catch (error) {
      console.warn('无法读取模型目录:', error)
      return null
    }
  }

  // 加载模型
  public async load(canvas: HTMLCanvasElement, config: ModelConfig): Promise<ModelInfo | null> {
    this.initApp(canvas)
    this.destroy()

    try {
      console.log('Live2DManager: 开始加载模型', config.name)
      
      // 自动发现配置文件
      const configFileName = config.configFile || await this.findModelConfig(config.path)
      if (!configFileName) {
        throw new Error('未找到模型配置文件')
      }

      const configPath = `${config.path}/${configFileName}`
      const actualConfigPath = await resolveResource(configPath)
      const modelJSON = JSON.parse(await readTextFile(actualConfigPath))

      console.log('Live2DManager: 模型配置文件读取成功', configFileName)

      // 创建模型设置
      const modelSettings = new Cubism4ModelSettings({
        ...modelJSON,
        url: convertFileSrc(actualConfigPath),
      })

      // 预处理资源文件路径
      await this.preprocessResourcePaths(modelSettings, config.path, modelJSON)

      console.log('Live2DManager: 开始从设置创建模型')
      
      // 加载模型
      this.model = await Live2DModel.from(modelSettings)
      
      if (!this.model) {
        throw new Error('模型创建失败')
      }

      console.log('Live2DManager: 模型创建成功，设置变换')

      // 设置模型位置和大小
      this.setupModelTransform(canvas)

      // 清理舞台上的其他模型（避免冲突）
      if (this.app?.stage) {
        // 移除当前舞台上的所有子对象
        while (this.app.stage.children.length > 0) {
          this.app.stage.removeChildAt(0)
        }
        
        // 添加新模型到舞台
        this.app.stage.addChild(this.model)
        console.log('Live2DManager: 模型已添加到舞台')
      }

      // 添加模型事件监听，防止模型意外销毁
      this.model.on('destroyed', () => {
        console.warn('Live2DManager: 模型被意外销毁')
      })

      const result = {
        width: this.model.width,
        height: this.model.height,
        motions: modelSettings.motions || {},
        expressions: modelSettings.expressions || [],
      }

      console.log('Live2DManager: 模型加载完成', result)
      return result
    } catch (error) {
      console.error('Live2DManager: 加载Live2D模型失败:', config.name, error)
      throw error
    }
  }

  // 预处理资源文件路径
  private async preprocessResourcePaths(
    modelSettings: Cubism4ModelSettings, 
    modelPath: string, 
    modelJSON: any
  ) {
    const filePathMap = new Map<string, string>()

    // 收集所有资源文件
    const allFiles = this.collectResourceFiles(modelJSON)

    // 预解析所有文件路径
    for (const file of allFiles) {
      if (file) {
        try {
          const resourcePath = `${modelPath}/${file}`
          const actualFilePath = await resolveResource(resourcePath)
          filePathMap.set(file, convertFileSrc(actualFilePath))
        } catch (error) {
          console.warn(`无法解析资源文件: ${file}`, error)
        }
      }
    }

    // 替换资源文件路径
    modelSettings.replaceFiles((file, _) => {
      return filePathMap.get(file) || convertFileSrc(`${modelPath}/${file}`)
    })
  }

  // 收集所有资源文件
  private collectResourceFiles(modelJSON: any): string[] {
    const files: string[] = []
    const refs = modelJSON.FileReferences

    if (!refs) return files

    // 添加各种资源文件
    if (refs.Moc) files.push(refs.Moc)
    if (refs.DisplayInfo) files.push(refs.DisplayInfo)
    if (refs.Textures) files.push(...refs.Textures)
    
    // 添加表情文件
    if (refs.Expressions) {
      files.push(...refs.Expressions.map((exp: any) => exp.File).filter(Boolean))
    }

    // 添加动作文件
    if (refs.Motions) {
      Object.values(refs.Motions).forEach((motionGroup: any) => {
        if (Array.isArray(motionGroup)) {
          files.push(...motionGroup.map((motion: any) => motion.File).filter(Boolean))
          // 添加音频文件
          files.push(...motionGroup.map((motion: any) => motion.Sound).filter(Boolean))
        }
      })
    }

    return files.filter(Boolean)
  }

  // 设置模型变换
  private setupModelTransform(canvas: HTMLCanvasElement) {
    if (!this.model) {
      console.warn('Live2DManager: 尝试设置变换但模型不存在')
      return
    }

    try {
      const { width, height } = this.model
      console.log('Live2DManager: 模型原始尺寸', { width, height })
      console.log('Live2DManager: 画布尺寸', { width: canvas.width, height: canvas.height })
      
      const scale = Math.min(canvas.width / width, canvas.height / height) * this.modelScale
      console.log('Live2DManager: 计算缩放比例', scale)
      
      this.model.scale.set(scale)
      this.model.x = canvas.width / 2
      this.model.y = canvas.height / 2
      this.model.anchor.set(0.5, 0.5)
      
      console.log('Live2DManager: 模型变换设置完成', {
        scale: this.model.scale.x,
        x: this.model.x,
        y: this.model.y,
        anchor: { x: this.model.anchor.x, y: this.model.anchor.y }
      })
    } catch (error) {
      console.error('Live2DManager: 设置模型变换失败', error)
    }
  }

  // 设置模型缩放（简化版本）
  public setModelScale(scale: number) {
    this.modelScale = Math.max(0.1, Math.min(2.0, scale))
    if (this.canvas) {
      this.setupModelTransform(this.canvas)
    }
  }

  // 获取当前缩放比例
  public getModelScale(): number {
    return this.modelScale
  }

  // 调整模型大小
  public resize(canvas: HTMLCanvasElement) {
    if (!this.model || !canvas) return
    this.setupModelTransform(canvas)
  }

  // 播放动作
  public playMotion(group: string, index: number) {
    return this.model?.motion(group, index)
  }

  // 播放表情
  public playExpression(index: number) {
    return this.model?.expression(index)
  }

  // 销毁模型
  public destroy() {
    if (this.model) {
      try {
        console.log('Live2DManager: 开始销毁模型')
        
        // 先从舞台移除模型
        if (this.app?.stage && this.model.parent) {
          this.app.stage.removeChild(this.model)
          console.log('Live2DManager: 模型已从舞台移除')
        }
        
        // 然后销毁模型
        this.model.destroy()
        console.log('Live2DManager: 模型已销毁')
      } catch (error) {
        console.warn('Live2DManager: 销毁模型时出现警告:', error)
      }
      this.model = null
    }
  }

  // 检查模型是否仍然有效
  public isModelValid(): boolean {
    return this.model && !this.model.destroyed
  }

  // 销毁应用
  public destroyApp() {
    this.destroy()
    if (this.canvas) {
      // 不直接销毁 app，让 GlobalAppManager 管理
      // this.appManager.destroyApp(this.canvas)
      this.app = null
      this.canvas = null
      console.log('Live2DManager: 应用引用已清理')
    }
  }
}

// 动作和表情接口
export interface Motion {
  File: string
  Name?: string
  FadeInTime?: number
  FadeOutTime?: number
}

export interface Expression {
  File: string
  Name?: string
}

// Live2D Composable
export function useLive2D() {
  const manager = new Live2DManager()
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const modelInfo = ref<ModelInfo | null>(null)
  const availableMotions = ref<{group: string, motions: Motion[]}[]>([])
  const availableExpressions = ref<Expression[]>([])

  // 加载模型
  const loadModel = async (canvas: HTMLCanvasElement, config: ModelConfig) => {
    isLoading.value = true
    error.value = null

    try {
      const info = await manager.load(canvas, config)
      if (info) {
        modelInfo.value = info
        
        // 处理动作
        availableMotions.value = Object.entries(info.motions).map(([group, motions]) => ({
          group,
          motions: motions as Motion[]
        }))
        
        // 处理表情
        availableExpressions.value = info.expressions
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载模型失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 调整大小
  const resize = (canvas: HTMLCanvasElement) => {
    manager.resize(canvas)
  }

  // 播放动作
  const playMotion = (group: string, index: number) => {
    return manager.playMotion(group, index)
  }

  // 播放表情
  const playExpression = (index: number) => {
    return manager.playExpression(index)
  }

  // 销毁
  const destroy = () => {
    manager.destroyApp()
    modelInfo.value = null
    availableMotions.value = []
    availableExpressions.value = []
    error.value = null
  }

  return {
    // 状态
    isLoading,
    error,
    modelInfo,
    availableMotions,
    availableExpressions,
    
    // 方法
    loadModel,
    resize,
    playMotion,
    playExpression,
    destroy,
    setModelScale: (scale: number) => manager.setModelScale(scale),
    getModelScale: () => manager.getModelScale(),
    isModelValid: () => manager.isModelValid()
  }
}

// 预定义的模型配置
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  simple: {
    name: 'Simple模型',
    path: 'assets/models/live2d/simple/runtime',
    configFile: 'simple.model3.json'
  },
  mark_free_zh: {
    name: 'Mark Free 中文版',
    path: 'assets/models/live2d/mark_free_zh/runtime',
    configFile: 'mark_free_t04.model3.json'
  }
}

// 获取所有可用模型的函数
export function getAllModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS)
}
