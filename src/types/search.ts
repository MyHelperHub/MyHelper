/** 搜索配置 */
export type SearchConfig = {
  /** 搜索类型 */
  searchType: SearchTypeEnum;
  /** 网页搜索引擎 */
  selectedEngine: SearchEngineEnum;
  /** 文件搜索选项 */
  searchOptions: FdSearchOptions;
};

/** 搜索类型 */
export enum SearchTypeEnum {
  Web = "web",
  File = "file",
}

/** 搜索引擎 */
export enum SearchEngineEnum {
  Baidu = "Baidu",
  Google = "Google",
  Bing = "Bing",
  Yahoo = "Yahoo",
}

/** 文件搜索选项 */
export type FdSearchOptions = {
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
  fileType?: FdFileTypeEnum;
  /** 文件扩展名 */
  extension?: string[];
  /** 最大搜索深度 */
  maxDepth?: number;
  /** 排除模式 */
  exclude?: string[];
  /** 大小写敏感 */
  caseSensitive?: boolean;
};

/** 文件搜索结果 */
export type FdSearchResult = {
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
};

/** 文件搜索的文件类型 */
export enum FdFileTypeEnum {
  File = "file",
  Directory = "directory",
  Symlink = "symlink",
  Executable = "executable",
}
