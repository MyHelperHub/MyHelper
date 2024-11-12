import { ipcCloseWindow, ipcCreateNewWindow } from '@/api/ipc/window.api'
import { NewWindowEnum } from '@/interface/windowEnum'
import { Ref } from 'vue'

export interface WindowConfig {
  type: NewWindowEnum
  title: string
  path: string
  size: [number, number]
}

/**
 * 统一的窗口控制函数
 * @param config 窗口配置
 * @param isOpen 窗口状态引用
 */
export const handleWindowToggle = async (
  config: WindowConfig, 
  isOpen: Ref<boolean>
) => {
  try {
    if (isOpen.value) {
      // 如果窗口已打开，尝试关闭
      try {
        await ipcCloseWindow(config.type)
        isOpen.value = false
      } catch (err) {
        // 如果关闭失败，说明窗口可能已经不存在
        // 这种情况下创建新窗口
        if (err === config.type) {
          await ipcCreateNewWindow(
            config.type,
            config.title,
            config.path,
            config.size
          )
          isOpen.value = true
        }
      }
    } else {
      // 如果窗口未打开，创建新窗口
      await ipcCreateNewWindow(
        config.type,
        config.title,
        config.path,
        config.size
      )
      isOpen.value = true
    }
  } catch (error) {
    // 确保状态与实际窗口状态同步
    isOpen.value = false
  }
}