declare module "#/api/ipc/window.api" {
  export function ipcWindowControl(
    operation: number,
    params?: { window_id?: string; always_on_top?: boolean },
  ): Promise<void>;
}

declare module "#/interface/enum" {
  export enum WindowOperation {
    Close = 0,
    Minimize = 1,
    Maximize = 2,
    Restore = 3,
    ToggleAlwaysOnTop = 4,
  }
}
