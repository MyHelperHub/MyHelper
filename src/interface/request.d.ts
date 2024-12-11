export interface ServerResponse<T = any> {
  Code: ResponseCodeEnum
  Data: T
  Message: string
  Page: {
    TotalRecords: number;
    PageIndex: number;
    PageSize: number;
  }
}

