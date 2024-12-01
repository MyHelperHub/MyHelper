declare module "#/api/ipc/window.api" {
  export function ipcCloseWindow(windowId?: string): Promise<void>;
}
