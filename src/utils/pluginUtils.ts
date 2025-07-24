/**
 * 插件相关工具函数
 */

/**
 * 格式化数字显示
 * @param num 数字
 * @returns 格式化后的字符串
 */
export const formatNumber = (num: number | undefined): string => {
  if (typeof num !== 'number' || isNaN(num)) return '0';
  return new Intl.NumberFormat('zh-CN').format(num);
};

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (bytes: number | undefined): string => {
  if (typeof bytes !== 'number' || bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
};

/**
 * 格式化日期
 * @param date 日期字符串
 * @param isDetail 是否显示详细时间
 * @returns 格式化后的日期字符串
 */
export const formatDate = (date: string | undefined, isDetail: boolean = false): string => {
  if (!date) return '--';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '--';
    
    return isDetail
      ? dateObj.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : dateObj.toLocaleDateString('zh-CN');
  } catch {
    return '--';
  }
};

/**
 * 比较版本号
 * @param currentVersion 当前版本
 * @param latestVersion 最新版本
 * @returns 是否有更新
 */
export const checkPluginUpdate = (
  currentVersion: string | undefined,
  latestVersion: string | undefined
): boolean => {
  if (!currentVersion || !latestVersion) return false;
  
  try {
    const parseVersion = (version: string): number[] => {
      // 移除非数字和点的字符（如 -beta, -alpha 等）
      const cleanVersion = version.replace(/[^\d.]/g, '');
      return cleanVersion.split('.').map(v => parseInt(v, 10) || 0);
    };
    
    const current = parseVersion(currentVersion);
    const latest = parseVersion(latestVersion);
    
    // 补齐版本号位数
    const maxLength = Math.max(current.length, latest.length);
    while (current.length < maxLength) current.push(0);
    while (latest.length < maxLength) latest.push(0);
    
    // 逐位比较
    for (let i = 0; i < maxLength; i++) {
      if (latest[i] > current[i]) return true;
      if (latest[i] < current[i]) return false;
    }
    
    return false;
  } catch {
    return false;
  }
};

/**
 * 安全获取对象属性
 * @param obj 对象
 * @param path 属性路径
 * @param defaultValue 默认值
 * @returns 属性值或默认值
 */
export const safeGet = <T>(
  obj: any,
  path: string,
  defaultValue: T
): T => {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 节流间隔（毫秒）
 * @returns 节流后的函数
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * 验证文件类型
 * @param file 文件对象
 * @param allowedTypes 允许的文件类型
 * @returns 是否为允许的文件类型
 */
export const validateFileType = (
  file: File,
  allowedTypes: string[]
): boolean => {
  if (!file || !file.type) return false;
  return allowedTypes.includes(file.type);
};

/**
 * 验证文件大小
 * @param file 文件对象
 * @param maxSizeInMB 最大文件大小（MB）
 * @returns 是否符合大小限制
 */
export const validateFileSize = (
  file: File,
  maxSizeInMB: number
): boolean => {
  if (!file) return false;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};