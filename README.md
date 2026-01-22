# Plugin Center

一个功能强大的插件中心系统，支持 UserScript 风格的插件管理、执行和 UI 界面。采用 Monorepo 架构，提供核心 API 和 React UI 组件。

## ✨ 特性

- 🎯 **插件管理**：完整的插件 CRUD 操作，支持批量操作
- 🚀 **插件执行**：基于 URL 匹配规则的智能插件执行（类似 Tampermonkey）
- 📦 **UserScript 支持**：支持标准的 UserScript 元数据格式（@name, @match, @version 等）
- 💾 **数据持久化**：自动保存到 localStorage，刷新后自动恢复
- 🎨 **React UI**：开箱即用的 React 组件库
- 🔄 **状态管理**：支持 Zustand 和 MobX 两种状态管理方案
- 📊 **事件系统**：完整的事件监听机制（插件添加、删除、更新、执行等）
- ✅ **类型安全**：完整的 TypeScript 类型定义
- 🛠️ **错误处理**：完善的错误捕获和历史记录

## 📦 项目结构

```
webcomponent-plugin-center/
├── packages/
│   ├── plugin-core/          # 核心 API（无 UI）
│   │   ├── src/
│   │   │   ├── plugin-core.ts        # 主类
│   │   │   ├── plugin.service.ts     # 服务层
│   │   │   ├── plugin.entity.ts      # 实体层（Zustand）
│   │   │   ├── plugin.entity.mobx.ts # 实体层（MobX）
│   │   │   ├── plugin.entity.zustand.ts # 实体层（Zustand）
│   │   │   ├── plugin-utils.ts       # 工具函数
│   │   │   └── types.ts              # 类型定义
│   │   └── package.json
│   └── plugin-ui/            # React UI 组件
│       ├── src/
│       │   ├── PluginCenter.tsx      # 主组件
│       │   ├── PluginForm.tsx        # 插件表单
│       │   ├── PluginList.tsx        # 插件列表
│       │   └── PluginItem.tsx        # 插件项
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd webcomponent-plugin-center

# 安装依赖
pnpm install
```

### 使用核心 API

```bash
pnpm add @plugin-center/core
```

```typescript
import { createPluginCenter } from '@plugin-center/core';

// 初始化插件中心
const pluginCenter = createPluginCenter({
  plugin: [
    {
      name: "示例插件",
      description: "这是一个示例插件",
      enabled: true,
      allowDelete: true,
      content: `// ==UserScript==
// @name         Example Plugin
// @description  Example description
// @match        https://example.com/*
// ==/UserScript==
(function() {
    console.log('Hello from plugin!');
})();`
    }
  ],
  setting: {
    mode: "api",
    autoExecute: true
  }
});

// 添加插件
pluginCenter.addPlugin({
  name: "新插件",
  description: "插件描述",
  enabled: true,
  allowDelete: true,
  content: "// 插件代码..."
});

// 执行插件
pluginCenter.executePlugin('plugin-id');

// 获取插件列表
const plugins = pluginCenter.getPlugins();
```

### 使用 React UI

```bash
pnpm add @plugin-center/ui @plugin-center/core
```

```tsx
import React from 'react';
import { PluginCenter } from '@plugin-center/ui';

function App() {
  return (
    <PluginCenter
      config={{
        plugin: [],
        setting: {
          mode: 'api'
        }
      }}
      onError={(error) => {
        console.error('插件中心错误:', error);
      }}
    />
  );
}
```

## 📚 文档

- [@plugin-center/core 文档](./packages/plugin-core/README.md) - 核心 API 详细文档
- [@plugin-center/ui 文档](./packages/plugin-ui/README.md) - UI 组件使用文档

## 🛠️ 开发

### 构建

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm --filter @plugin-center/core build
pnpm --filter @plugin-center/ui build
```

### 开发模式

```bash
# 运行 UI 示例
cd packages/plugin-ui
pnpm dev
```

### 测试

```bash
# 运行测试（如果有）
pnpm test
```

## 📋 核心功能

### 插件管理

- ✅ 添加、删除、更新插件
- ✅ 批量操作（批量添加、删除、更新）
- ✅ 插件查询和筛选
- ✅ 插件导入/导出（JSON 格式）

### 插件执行

- ✅ 基于 URL 匹配规则的智能执行
- ✅ 支持多个 `@match` 规则
- ✅ 自动执行所有启用的插件
- ✅ 手动执行指定插件

### 状态管理

- ✅ 启用/禁用插件
- ✅ 实时状态同步
- ✅ 支持 Zustand 和 MobX

### 事件系统

- ✅ `pluginAdded` - 插件添加
- ✅ `pluginDeleted` - 插件删除
- ✅ `pluginUpdated` - 插件更新
- ✅ `pluginEnabled` - 插件启用
- ✅ `pluginDisabled` - 插件禁用
- ✅ `pluginExecuted` - 插件执行

### 错误处理

- ✅ 错误捕获和记录
- ✅ 错误历史查询
- ✅ 自定义错误处理器

## 🔧 技术栈

- **构建工具**: Vite
- **语言**: TypeScript
- **包管理**: pnpm (Monorepo)
- **状态管理**: Zustand / MobX
- **UI 框架**: React
- **代码风格**: TypeScript Strict Mode

## 📝 URL 匹配规则

插件支持通过 `@match` 元数据指定 URL 匹配规则：

- `*` - 匹配除路径分隔符外的任意字符
- `**` - 匹配任意字符（包括路径分隔符）
- 支持多个 `@match` 规则（只要匹配其中一个即可）
- 如果没有 `@match` 规则，插件会在所有页面执行

示例：
```
// @match https://example.com/*
// @match https://*.example.com/path/*
```

## 💾 数据持久化

插件数据会自动保存到 `localStorage`，键名为 `front_plugin_center_plugins`。刷新页面后数据会自动恢复。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 👥 作者

electrolux
