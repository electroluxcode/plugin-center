# @plugin-center/ui

基于 `@plugin-center/core` 的 React UI 组件库，提供了完整的插件管理界面。

## 安装

```bash
pnpm add @plugin-center/ui
```

## 快速开始

### 基础用法

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

### 使用独立组件

如果你需要自定义布局，可以使用独立的组件：

```tsx
import React from 'react';
import { PluginForm, PluginList } from '@plugin-center/ui';
import { createPluginCenter, pluginEntity, Plugin } from '@plugin-center/core';

function CustomApp() {
  const [plugins, setPlugins] = React.useState<Plugin[]>([]);
  const pluginCenter = React.useMemo(
    () => createPluginCenter({
      plugin: [],
      setting: { mode: 'api' }
    }),
    []
  );

  React.useEffect(() => {
    const unsubscribe = pluginEntity.subscribe(setPlugins);
    setPlugins(pluginCenter.getPlugins());
    return unsubscribe;
  }, [pluginCenter]);

  const handleAdd = (plugin: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>) => {
    pluginCenter.addPlugin(plugin);
  };

  const handleExecute = (pluginId: string) => {
    pluginCenter.executePlugin(pluginId);
  };

  const handleDelete = (pluginId: string) => {
    pluginCenter.deletePlugin(pluginId);
  };

  return (
    <div>
      <PluginForm onSubmit={handleAdd} />
      <PluginList
        plugins={plugins}
        onExecute={handleExecute}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

## 组件说明

### PluginCenter

主组件，整合了所有功能。

**Props:**
- `config?: PluginCenterConfig` - 插件中心配置
- `onError?: (error: Error) => void` - 错误回调

### PluginForm

插件添加表单组件。

**Props:**
- `onSubmit: (plugin: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>) => void` - 提交回调
- `onError?: (error: Error) => void` - 错误回调

### PluginList

插件列表组件。

**Props:**
- `plugins: Plugin[]` - 插件列表
- `onExecute: (pluginId: string) => void` - 执行插件回调
- `onDelete: (pluginId: string) => void` - 删除插件回调

### PluginItem

单个插件项组件。

**Props:**
- `plugin: Plugin` - 插件数据
- `onExecute: (pluginId: string) => void` - 执行插件回调
- `onDelete: (pluginId: string) => void` - 删除插件回调

## 功能特性

- ✅ 添加插件（名称、描述、内容）
- ✅ 显示插件列表
- ✅ 执行单个插件
- ✅ 执行所有启用的插件
- ✅ 删除插件
- ✅ 自动订阅插件变化，实时更新 UI
- ✅ 错误处理

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式（运行示例）
pnpm examples:dev
```

## 示例

运行示例：

```bash
pnpm examples:dev
```

然后访问 http://localhost:3000
