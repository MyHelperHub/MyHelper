/** 快捷网站和软件的列表item */
export type SelectItem = {
  /** -1时为编辑 */
  id: number;
  /** 名称 */
  title: string;
  /** 软件路径 */
  src?: string;
  /** 网站地址 */
  url?: string;
  /** 图标 */
  logo: string;
};

/** 快捷输入的列表item */
export type QuickInputItem = {
  id: number;
  text: string;
};
