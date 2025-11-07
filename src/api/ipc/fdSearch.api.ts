import { invokeApi } from "./wrapper";
import type { SearchOptions, SearchResult } from "@/types/fdSearch";

/**
 * 文件搜索
 * @param options 搜索选项
 */
export async function ipcFdSearch(
  options: SearchOptions,
): Promise<SearchResult[]> {
  return await invokeApi<SearchResult[]>("fd_search", { options });
}
