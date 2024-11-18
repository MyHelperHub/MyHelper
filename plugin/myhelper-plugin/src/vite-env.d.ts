/// <reference types="vite/client" />

// 声明外层项目的模块
declare module '@/*' {
  const content: any
  export default content
}
