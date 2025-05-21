declare module "mh-plugin/mhPlugin.json" {
  const content: {
    windowId: string;
    title: string;
    size: [number, number];
    position: [number, number];
    alwaysOnTop: boolean;
    resizable: boolean;
    icon: string;
  };
  export default content;
}
