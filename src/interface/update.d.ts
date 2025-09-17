export type UpdateProgress = {
  downloaded: number;
  total: number;
  percent: number;
}

export type UpdateResult = {
  shouldUpdate: boolean;
  version?: string;
  notes?: string;
  date?: string;
}
export type UpdateState = {
  checking: boolean;
  downloading: boolean;
  currentVersion: string;
  newVersion: string;
  notes: string;
  date: string;
  progress: UpdateProgress;
}
