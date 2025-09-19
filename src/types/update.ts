/** 更新进度 */
export type UpdateProgress = {
  /** 已下载大小 */
  downloaded: number;
  /** 总大小 */
  total: number;
  /** 进度百分比 */
  percent: number;
};

/** 更新结果 */
export type UpdateResult = {
  /** 是否需要更新 */
  shouldUpdate: boolean;
  /** 版本号 */
  version?: string;
  /** 更新说明 */
  notes?: string;
  /** 发布时间 */
  date?: string;
};

/** 更新状态 */
export type UpdateState = {
  /** 是否正在检查更新 */
  checking: boolean;
  /** 是否正在下载更新 */
  downloading: boolean;
  /** 当前版本号 */
  currentVersion: string;
  /** 最新版本号 */
  newVersion: string;
  /** 更新说明 */
  notes: string;
  /** 发布时间 */
  date: string;
  /** 更新进度 */
  progress: UpdateProgress;
};
