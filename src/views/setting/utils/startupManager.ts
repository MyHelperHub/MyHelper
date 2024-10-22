type StartupTask = {
  key: string; // 设置项的 key
  enabledFn: () => Promise<void> | void; // 启用时的执行函数
  disabledFn?: () => Promise<void> | void; // 禁用时的执行函数 (可选)
  startEnabledFn?: boolean; // 是否在启动时执行启用函数，默认为 true
  startDisabledFn?: boolean; // 是否在启动时执行禁用函数，默认为 false
};

const startupTasks: StartupTask[] = [];

/**
 * 注册开机启动任务
 * @param task 任务配置对象，包含以下属性:
 *   - key: 设置项的唯一标识符
 *   - enabledFn: 启用时执行的函数
 *   - disabledFn: 禁用时执行的函数（可选）
 *   - startEnabledFn: 启动时是否执行启用函数，默认为 true
 *   - startDisabledFn: 启动时是否执行禁用函数，默认为 false
 */
export function registerTask(task: StartupTask) {
  // 默认值设置
  task.startEnabledFn = task.startEnabledFn ?? true;
  task.startDisabledFn = task.startDisabledFn ?? false;

  startupTasks.push(task);
}

/**
 * 根据设置项的值，执行对应的任务
 * @param getSetting 函数，用于获取设置项的值
 */
export async function runStartupTasks(getSetting: (key: string) => boolean) {
  for (const task of startupTasks) {
    const isEnabled = getSetting(task.key);

    // 仅在设置为启用且需要在启动时运行的任务执行
    if (isEnabled && task.startEnabledFn) {
      await task.enabledFn(); // 调用启用时的执行函数
    } else if (!isEnabled && task.startDisabledFn && task.disabledFn) {
      // 如果当前任务是启用的，而设置项变为禁用，则调用禁用时的执行函数（如果有）
      await task.disabledFn();
    }
  }
}

/**
 * 当设置项切换时，执行对应的启用/停用逻辑
 * @param key 设置项的 key
 * @param isEnabled 是否启用
 * @returns Promise<void> 表示异步操作的完成
 */
export async function handleSettingChange(
  key: string,
  isEnabled: boolean,
): Promise<void> {
  const task = startupTasks.find((task) => task.key === key);

  if (!task) {
    console.log(`No startup task found for key: ${key}`);
    return; // 如果没有找到对应的任务，直接返回
  }

  if (isEnabled && task.enabledFn) {
    await task.enabledFn(); // 启用时执行
  } else if (!isEnabled && task.disabledFn) {
    await task.disabledFn(); // 禁用时执行
  }
}
