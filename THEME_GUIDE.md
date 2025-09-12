# MyHelper 主题系统开发指南

## 🎨 主题变量总览

### 颜色变量
| 变量 | 用途 | 使用场景 |
|------|------|----------|
| `--theme-primary` | 主色调 | 按钮、链接、强调色 |
| `--theme-primary-light` | 主色调浅色 | hover 状态、次要强调 |
| `--theme-primary-dark` | 主色调深色 | active 状态、深色强调 |
| `--theme-background` | 主背景色 | 窗口背景、大面积背景 |
| `--theme-background-secondary` | 次要背景色 | 工具栏、侧边栏 |
| `--theme-background-card` | 卡片背景色 | 弹窗、卡片、列表项 |
| `--theme-text` | 主文字色 | 标题、正文 |
| `--theme-text-secondary` | 次要文字色 | 副标题、说明文字 |
| `--theme-text-muted` | 弱化文字色 | 占位符、禁用文字 |
| `--theme-border` | 边框色 | 分割线、边框 |
| `--theme-border-light` | 浅色边框 | 弱化分割线 |
| `--theme-success` | 成功色 | 成功提示、确认按钮 |
| `--theme-warning` | 警告色 | 警告提示、注意按钮 |
| `--theme-error` | 错误色 | 错误提示、危险按钮 |
| `--theme-info` | 信息色 | 信息提示、帮助按钮 |

### 透明度变量
| 变量 | 默认值 | 应用场景 |
|------|--------|----------|
| `--theme-transparency-background` | 0.9 | 主窗口背景 |
| `--theme-transparency-background-secondary` | 0.8 | 功能按钮、工具栏 |
| `--theme-transparency-card` | 0.85 | 弹窗、卡片、列表 |
| `--theme-transparency-border` | 0.3 | 所有边框 |

### 阴影变量
| 变量 | 用途 |
|------|------|
| `--theme-shadow-sm` | 小阴影 |
| `--theme-shadow-md` | 中等阴影 |
| `--theme-shadow-lg` | 大阴影 |

## 🎯 快速选择指南

### 颜色选择
```css
/* 文字颜色 */
color: var(--theme-text);           /* 主要文字 */
color: var(--theme-text-secondary); /* 次要文字 */
color: var(--theme-text-muted);     /* 弱化文字 */

/* 背景颜色 */
background: var(--theme-primary);            /* 强调背景 */
background: var(--theme-background);         /* 主背景 */
background: var(--theme-background-card);    /* 卡片背景 */

/* 边框颜色 */
border: 1px solid var(--theme-border);       /* 普通边框 */
border: 1px solid var(--theme-border-light); /* 弱化边框 */

/* 状态颜色 */
color: var(--theme-success);  /* 成功 */
color: var(--theme-warning);  /* 警告 */
color: var(--theme-error);    /* 错误 */
color: var(--theme-info);     /* 信息 */
```

### 透明度选择
```css
/* 主窗口背景 */
background: rgba(var(--theme-background-rgb), var(--theme-transparency-background));

/* 按钮、工具栏 */
background: rgba(var(--theme-background-secondary-rgb), var(--theme-transparency-background-secondary));

/* 弹窗、卡片、列表 */
background: rgba(var(--theme-background-card-rgb), var(--theme-transparency-card));

/* 边框 */
border: 1px solid rgba(var(--theme-border-rgb), var(--theme-transparency-border));
```

## ✅ 标准写法模板

### 基础组件
```css
/* 主窗口 */
.main-window {
  background: rgba(var(--theme-background-rgb), var(--theme-transparency-background));
  color: var(--theme-text);
  backdrop-filter: blur(20px);
}

/* 按钮 */
.primary-button {
  background: var(--theme-primary);
  color: var(--theme-background);
  border: 1px solid var(--theme-primary);
  box-shadow: var(--theme-shadow-sm);
}

.primary-button:hover {
  background: var(--theme-primary-dark);
  box-shadow: var(--theme-shadow-md);
}

/* 卡片 */
.card {
  background: rgba(var(--theme-background-card-rgb), var(--theme-transparency-card));
  color: var(--theme-text);
  border: 1px solid rgba(var(--theme-border-rgb), var(--theme-transparency-border));
  border-radius: 12px;
  backdrop-filter: blur(16px);
  box-shadow: var(--theme-shadow-sm);
}

/* 文字层级 */
.title { color: var(--theme-text); }
.subtitle { color: var(--theme-text-secondary); }
.caption { color: var(--theme-text-muted); }
```

### 交互状态
```css
/* Hover 增强 */
.interactive:hover {
  background: rgba(var(--theme-background-secondary-rgb), 
             calc(var(--theme-transparency-background-secondary) + 0.05));
  box-shadow: var(--theme-shadow-md);
}

/* 状态提示 */
.success { color: var(--theme-success); }
.warning { color: var(--theme-warning); }
.error { color: var(--theme-error); }
.info { color: var(--theme-info); }
```

## ❌ 禁止写法

```css
/* 硬编码颜色 */
color: #ffffff; ❌
background: rgba(255, 255, 255, 0.9); ❌

/* 混用变量类型 */
background: rgba(var(--theme-background), var(--theme-transparency-card)); ❌

/* 不遵循语义 */
.error-message { color: var(--theme-success); } ❌

/* 层级错误 */
.button { background: rgba(var(--theme-background-card-rgb), var(--theme-transparency-card)); } ❌
```

## 🚀 开发规范

### 🔴 强制要求
1. **禁止硬编码** - 所有颜色、透明度必须使用主题变量
2. **语义化使用** - 按变量的语义用途使用，不要混用
3. **RGB 配对** - 透明度必须与对应的 `-rgb` 变量配合使用
4. **遵循层级** - 按视觉层级选择正确的透明度变量

### 🎯 最佳实践
1. **优先使用语义变量** - 用 `--theme-success` 而不是 `--theme-green`
2. **保持一致性** - 相同功能的组件使用相同的变量
3. **响应式设计** - 确保所有主题模式下都正常显示
4. **性能优化** - 合理使用 `backdrop-filter` 和阴影

## 🔧 配置和扩展

### 用户设置位置
- **预设主题**: 设置 → 主题设置 → 选择预设
- **自定义主题**: 设置 → 主题设置 → 自定义主题

### 代码位置
- **变量生成**: `src/themes/theme.ts`
- **默认定义**: `src/assets/css/theme.less`
- **应用示例**: `src/assets/css/common.css`

### RGB 变量说明
系统自动生成对应的 RGB 变量：
- `--theme-primary` → `--theme-primary-rgb` (如: `59, 130, 246`)
- `--theme-background` → `--theme-background-rgb` (如: `255, 255, 255`)

## 📋 开发检查清单

新建组件时确认：
- [ ] 是否使用了硬编码颜色？
- [ ] 颜色语义是否正确？
- [ ] 透明度变量是否配对正确？
- [ ] 是否添加了适当的毛玻璃效果？
- [ ] Hover 状态是否符合规范？
- [ ] 各种主题模式下是否正常显示？

---

**核心原则**: 所有界面元素必须使用主题变量，确保主题设置能正确应用到每个细节！