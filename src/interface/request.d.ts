export interface ServerResponse<T = any> {
  Code: ResponseCodeEnum
  Data: T
  Message: string
}

