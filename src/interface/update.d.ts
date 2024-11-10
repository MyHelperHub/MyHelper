export interface UpdateProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export interface UpdateResult {
  shouldUpdate: boolean;
  version?: string;
  notes?: string;
  date?: string;
}
export interface UpdateState {
  checking: boolean;
  downloading: boolean;
  currentVersion: string;
  newVersion: string;
  notes: string;
  date: string;
  progress: UpdateProgress;
}
