# @plugin-center/core

插件中心核心 API，不包含任何 UI 代码。提供完整的插件管理、执行、事件监听等功能。

## 安装

```bash
pnpm add @plugin-center/core
```

## 快速开始

```typescript
import { createPluginCenter, Plugin } from '@plugin-center/core';

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
    mode: "api", // 或 "list"
    id: "plugin-container", // list 模式下需要
    autoExecute: true // 是否在初始化时自动执行所有启用的插件，默认为 true
  }
});

// 使用 API
pluginCenter.addPlugin({ ... });
pluginCenter.getPlugins();
pluginCenter.executePlugin('plugin-id');
```

## API 文档

### 插件管理

- `addPlugin(plugin)` - 添加插件
- `deletePlugin(pluginId)` - 删除插件
- `updatePlugin(pluginId, updateData)` - 更新插件
- `getPlugin(pluginId)` - 获取单个插件
- `getPlugins(query?)` - 获取插件列表（支持查询条件）

### 插件状态

- `enablePlugin(pluginId)` - 启用插件
- `disablePlugin(pluginId)` - 禁用插件
- `togglePlugin(pluginId)` - 切换插件启用状态

### 插件执行

- `executePlugin(pluginId)` - 执行指定插件（会根据 @match 规则匹配 URL）
- `executeAllEnabledPlugins()` - 执行所有启用的插件
- `checkPluginMatch(pluginId, url?)` - 检查插件是否匹配指定 URL

### 批量操作

- `batchAddPlugins(plugins)` - 批量添加插件
- `batchDeletePlugins(pluginIds)` - 批量删除插件
- `batchUpdatePlugins(updates)` - 批量更新插件

### 插件导入/导出

- `getPluginExports(pluginId)` - 获取插件的导出内容（不执行插件，只解析并返回导出）
- `importPlugin(pluginId)` - 导入插件（与 `getPluginExports` 相同，支持类似 ES6 import 的用法）

### 事件监听

- `on(event, callback)` - 监听事件（pluginAdded, pluginDeleted, pluginUpdated, pluginEnabled, pluginDisabled, pluginExecuted）
- `off(event, callback)` - 取消监听

### 其他

- `getPluginStats()` - 获取插件统计信息
- `exportPlugins()` - 导出所有插件为 JSON
- `importPlugins(jsonString)` - 从 JSON 导入插件
- `parsePluginMetadata(content)` - 解析 UserScript 元数据
- `validatePlugin(content)` - 验证插件内容格式
- `setMode(mode, mountId?)` - 设置显示模式
- `getMode()` - 获取当前模式
- `setErrorHandler(handler)` - 设置错误处理器
- `getErrorHistory(limit?)` - 获取错误历史记录
- `clearAllPlugins()` - 清空所有插件

### 常量

- `PLUGIN_STORAGE_KEY` - localStorage 存储键名（值为 `'front_plugin_center_plugins'`）

## 类型定义

### Plugin

```typescript
type Plugin = {
  id: string;                    // 插件唯一标识（自动生成）
  name: string;                  // 插件名称
  icon?: string;                 // 插件图标
  description: string;           // 插件描述
  enabled: boolean;              // 是否启用
  allowDelete: boolean;          // 是否允许删除
  content: string;               // 插件代码内容
  metadata?: PluginMetadata;     // 解析后的元数据
  createdAt?: number;           // 创建时间戳
  updatedAt?: number;           // 更新时间戳
}
```

### PluginMetadata

```typescript
type PluginMetadata = {
  name?: string;                 // @name
  namespace?: string;            // @namespace
  version?: string;              // @version
  description?: string;          // @description
  author?: string;               // @author
  match?: string[];              // @match (支持多个)
  icon?: string;                 // @icon
  [key: string]: any;            // 其他元数据
}
```

### PluginQuery

```typescript
type PluginQuery = {
  name?: string;                 // 按名称模糊查询
  enabled?: boolean;             // 按启用状态筛选
  id?: string;                   // 按ID精确查询
}
```

## URL 匹配规则

插件支持通过 `@match` 元数据指定 URL 匹配规则，类似 Tampermonkey：

- `*` - 匹配除路径分隔符外的任意字符
- `**` - 匹配任意字符（包括路径分隔符）
- 支持多个 `@match` 规则（只要匹配其中一个即可）
- 如果没有 `@match` 规则，插件会在所有页面执行

示例：
```
// @match https://example.com/*
// @match https://*.example.com/path/*
```

## 数据持久化

插件数据会自动保存到 `localStorage`，键名为 `front_plugin_center_plugins`。刷新页面后数据会自动恢复。

## License

MIT
