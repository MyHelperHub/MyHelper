export interface SearchOptions {
  /** 搜索路径 */
  paths: string[];
  /** 搜索模式（正则或 glob） */
  pattern?: string;
  /** 是否为 glob 语法 */
  isGlob?: boolean;
  /** 包含隐藏文件 */
  hidden?: boolean;
  /** 忽略 .gitignore */
  noIgnore?: boolean;
  /** 文件类型 */
  fileType?: FileType;
  /** 文件扩展名 */
  extension?: string[];
  /** 最大搜索深度 */
  maxDepth?: number;
  /** 排除模式 */
  exclude?: string[];
  /** 大小写敏感 */
  caseSensitive?: boolean;
}

export interface SearchResult {
  /** 文件路径 */
  path: string;
  /** 文件类型 */
  fileType: string;
  /** 文件大小（字节） */
  size?: number;
  /** 文件名 */
  name: string;
  /** 是否隐藏 */
  isHidden: boolean;
}

export type FileType = "file" | "directory" | "symlink" | "executable";

export interface SearchPreset {
  name: string;
  description?: string;
  options: Partial<SearchOptions>;
}

export const SEARCH_PRESETS: SearchPreset[] = [
  { name: "仅文件", options: { fileType: "file" } },
  { name: "仅目录", options: { fileType: "directory" } },
  { name: "包含隐藏文件", options: { hidden: true } },
  { name: "忽略 .gitignore", options: { noIgnore: true } },
  { name: "浅层搜索", options: { maxDepth: 3 } },
];

