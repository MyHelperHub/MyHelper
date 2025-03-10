# MyHelper 🚀

基于 Tauri v2 开发的跨平台效率工具。

## ✨ 主要功能

- 🔥插件系统🔥

  - 开发便捷：
    - 内置Vue3 + TS开发模板
    - 完整的类型提示
    - 热重载秒级生效
    - 默认集成PrimeVue组件库(也可使用任意组件库)
  - 功能强大：
    - 支持窗口自定义（大小、位置）
    - 可调用系统API
    - 支持插件配置存储
  - 轻松上架：
    - 快速打包上传
    - 快速审核上线
    - 支持版本更新
  - 生态共享：
    - 插件市场浏览
    - 开发者社区支持

- 🚀 快捷启动器

  - 常用网站、软件快速启动
  - 自定义图标和分组

- 📝 桌面便签

  - 随手记录功能
  - 可爱的便签样式
  - 便签置顶显示
  - 可拖拽定位

- 📋 剪贴板管理

  - 监听系统剪贴板
  - 历史记录展示
  - 点击可粘贴内容

- ⌨️ 全局快捷键
  - 支持自定义快捷键
  - 控制全局功能开关

## 💻 系统要求

- Windows 10/11
- macOS 10.15+
- Linux (X11)

## 🛠️ 开发环境

- Node.js >= 16
- Rust >= 1.75
- npm >= 9.0

## 🚀 快速开始

1. 克隆项目

```bash
git clone https://github.com/MyHelperHub/myhelper.git
cd myhelper
```

2. 安装依赖

```bash
npm install
cd plugin/mh-plugin && npm install
```

3. 开发调试

```bash
npm run tauri dev
```

4. 构建发布

```bash
npm run tauri build
```

## 🔧 插件开发

1. 进入插件目录

```bash
cd plugin/mh-plugin
```

2. 配置插件信息
   编辑 `myPlugin.json` 文件，填写插件基本信息

3. 开发调试

```bash
npm run dev
```

详细文档请参考 [插件开发指南](./docs/plugin-development.md)

## 🔗 相关链接

- 📚 [项目文档](https://github.com/MyHelperHub/myhelper/wiki)
- 🐛 [问题反馈](https://github.com/MyHelperHub/myhelper/issues)

## 📞 联系方式

- ✉️ 作者邮箱：ialtone@ialtone.xyz
- 🐧 QQ交流群：206028763

## 📄 许可证

[GPL License](./LICENSE)
