import { invokeApi } from "./wrapper";
import type { FdSearchOptions, FdSearchResult } from "@/types/search";

/**
 * 文件搜索
 * @param options 搜索选项
 */
export async function ipcFdSearch(
  options: FdSearchOptions,
): Promise<FdSearchResult[]> {
  return await invokeApi<FdSearchResult[]>("fd_search", { options });
}
