# MyHelper 插件开发指南 🔌

## 目录

- [快速开始](#快速开始)
- [插件能力](#插件能力)
- [开发规范](#开发规范)
- [发布流程](#发布流程)
- [API文档](#api文档)
- [常见问题](#常见问题)

## 快速开始

### 1. 创建插件

```bash
# 进入插件目录
cd plugin/mh-plugin

# 安装依赖
npm install
```

### 2. 配置插件信息

编辑 `myPlugin.json` (**_此名不可修改！！_**)，必须严格按照以下格式配置：

```json
{
  "windowId": "mh-plugin", // 插件窗口ID，必填且唯一
  "title": "新建插件", // 插件窗口标题
  "size": [800, 600], // 窗口大小 [宽, 高]
  "position": [-1, -1], // 窗口位置 [x, y]，-1 表示居中
  "alwaysOnTop": false, // 是否窗口置顶
  "resizable": true, // 是否允许调整大小
  "icon": "./icon.png" // 插件图标路径
}
```

**注意事项：**

- 所有字段都必须填写，不能缺少
- 字段类型必须严格匹配
- `windowId` 在所有插件中必须唯一
- `size` 和 `position` 必须是两个元素的数组
- `icon` 路径相对于插件根目录，也可以是网络图标

### 3. 开发调试

```bash
npm run dev
```

## 插件能力

### 窗口管理

- 自定义窗口大小、位置
- 支持多窗口创建
- 可设置窗口置顶

### 系统API

- 文件读写操作
- 系统通知发送
- 快捷键注册

### 数据存储

- 本地配置存储
- 插件数据读写

### UI组件

- 默认集成 PrimeVue 组件库
- 支持自定义引入其他组件库：
  - Element Plus
  - Ant Design Vue
  - Naive UI
  - ...等任意 Vue3 组件库
- 支持自定义样式
- 完全自由的界面设计

## 开发规范

### 目录结构

```
mh-plugin/
├── src/
│   ├── components/     # 组件目录
│   ├── utils/          # 工具函数
│   ├── App.vue         # 主组件
│   └── main.ts         # 入口文件
├── myPlugin.json       # 插件配置
├── tsconfig.json       # TypeScript配置
└── package.json        # 项目配置
```

### 代码规范

- 使用TypeScript开发（推荐）
- 遵循Vue3组合式API
- 使用ESLint+Prettier保持代码风格一致

## 发布流程

1. 打包插件

```bash
npm run build
```

2. 提交审核

- 填写完整的插件信息
- 上传插件截图
- 提供功能说明
- 提交审核申请

3. 发布上线

- 审核通过后发布到插件市场
- 支持版本更新

## API文档

### 窗口API

```typescript
// 创建新窗口
createWindow(options: WindowOptions): Promise<Window>

// 关闭窗口
closeWindow(id: string): Promise<void>

// 窗口置顶
setAlwaysOnTop(value: boolean): Promise<void>
```

### 数据API

```typescript
// 存储数据
setPluginData(key: string, value: any): Promise<void>

// 读取数据
getPluginData(key: string): Promise<any>

// 删除数据
deletePluginData(key: string): Promise<void>
```

### 系统API

```typescript
// 发送通知
sendNotification(options: NotificationOptions): Promise<void>

// 注册快捷键
registerShortcut(key: string, callback: () => void): Promise<void>
```

## 示例代码

### 基础插件模板

```vue
<template>
  <div class="my-plugin">
    <h1>{{ title }}</h1>
    <Button @click="handleClick"> 点击测试 </Button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Button from "primevue/button";

const title = ref("MyHelper Plugin");

const handleClick = () => {
  console.log("Button clicked!");
};
</script>
```

### 路径引用说明

#### 插件开发中的路径引用

- `@/` 指向 MyHelper 主项目的 `src` 目录
  ```typescript
  // ✅ 正确示例
  import { ipcCloseWindow } from "@/api/ipc/window.api"; // 实际路径: myhelper/src/api/ipc/window.api
  ```

#### 注意事项

- 插件中使用 `@/` 可以直接访问主项目的所有功能
- 也可自行在 `tsconfig.json` 中配置路径别名

## 常见问题

### Q: 如何调试插件？

A: 使用 `npm run dev` 启动开发服务器，支持热重载和控制台调试。

### Q: 如何使用系统API？

A: 通过 `@tauri-apps/api` 调用系统API，详见API文档。

### Q: 如何更新插件？

A: 修改 `myPlugin.json` 中的配置，重新打包提交即可。

## 联系我们

- 开发者社区：[链接]
- 问题反馈：[Issues](https://github.com/MyHelperHub/myhelper/issues)
- QQ交流群：206028763
