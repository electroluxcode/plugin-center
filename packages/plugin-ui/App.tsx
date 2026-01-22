import React, { useEffect, useRef } from 'react';
import { PluginCenter, PluginCenterRef } from './src';
import { pluginEntity, Plugin, createPluginCenter, PLUGIN_STORAGE_KEY } from '@plugin-center/core';

// 内置插件的固定 ID
const WELCOME_PLUGIN_ID = 'welcome-plugin';
const EXAMPLE_PLUGIN_ID = 'example-plugin';

// 内置欢迎插件的配置
const WELCOME_PLUGIN_CONTENT = `// ==UserScript==
// @name         欢迎插件
// @description  系统内置插件，展示插件中心功能
// @match        *
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('欢迎使用插件中心！');
    console.log('这是一个系统内置插件，用于演示功能。');
    
    // 在页面顶部显示欢迎信息
    const welcomeDiv = document.createElement('div');
    welcomeDiv.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      text-align: center;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    \`;
    welcomeDiv.textContent = '🎉 欢迎使用插件中心！这是一个系统内置插件示例。';
    document.body.appendChild(welcomeDiv);
    
    // 3秒后自动隐藏
    setTimeout(() => {
      welcomeDiv.style.transition = 'opacity 0.5s';
      welcomeDiv.style.opacity = '0';
      setTimeout(() => welcomeDiv.remove(), 500);
    }, 3000);
})();`;

// 示例插件的配置
const EXAMPLE_PLUGIN_CONTENT = `// ==UserScript==
// @name         示例插件
// @description  这是一个示例插件，展示如何创建自定义功能
// @match        *
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('示例插件已加载！');
    
    // 示例：在控制台输出当前页面信息
    console.log('当前页面:', window.location.href);
    console.log('页面标题:', document.title);
})();`;

// 默认插件配置
const DEFAULT_PLUGINS = [
  {
    id: WELCOME_PLUGIN_ID,
    config: {
      name: '欢迎插件',
      description: '这是一个系统内置插件，用于展示插件中心的功能。此插件不可删除。',
      content: WELCOME_PLUGIN_CONTENT,
      enabled: true,
      allowDelete: false
    }
  },
  {
    id: EXAMPLE_PLUGIN_ID,
    config: {
      name: '示例插件',
      description: '这是一个示例插件，展示如何创建自定义功能。此插件不可删除。',
      content: EXAMPLE_PLUGIN_CONTENT,
      enabled: false,
      allowDelete: false
    }
  }
];

// 初始化默认插件的函数（独立于 React 组件）
const initDefaultPlugins = (pluginCenter: ReturnType<typeof createPluginCenter>) => {
  DEFAULT_PLUGINS.forEach(({ id, config }) => {
    // 通过 getPlugin 方法检查是否存在指定 ID 的插件
    const existingPlugin = pluginCenter.getPlugin(id);
    
    // 如果不存在，则添加插件
    if (!existingPlugin) {
      try {
        const newPlugin = pluginCenter.addPlugin(config);
        
        // 添加后立即更新 id 为固定值
        if (newPlugin.id !== id) {
          // 直接操作 localStorage 和 pluginEntity 来更新 id
          const storedPlugins = localStorage.getItem(PLUGIN_STORAGE_KEY);
          if (storedPlugins) {
            const plugins = JSON.parse(storedPlugins);
            const updatedPlugins = plugins.map((p: Plugin) =>
              p.id === newPlugin.id ? { ...p, id } : p
            );
            pluginEntity.setPlugins(updatedPlugins);
          }
        }
      } catch (error) {
        console.error(`添加内置插件 ${id} 失败:`, error);
      }
    }
  });
};

const App: React.FC = () => {
  const handleError = (error: Error) => {
    console.error('插件中心错误:', error);
    // 使用更优雅的错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 59, 48, 0.95);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 10000;
      max-width: 400px;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
    `;
    errorDiv.textContent = `错误: ${error.message}`;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => errorDiv.remove(), 300);
    }, 3000);
  };

  // 创建 pluginCenter 实例的 ref
  const pluginCenterRef = useRef<PluginCenterRef>(null);

  // 初始化时检查并添加内置插件
  useEffect(() => {
    const pluginCenter = pluginCenterRef.current?.getPluginCenter();
    if (pluginCenter) {
      initDefaultPlugins(pluginCenter);
    }
  }, []);

  return (
    <PluginCenter
      config={{
        plugin: [], // 不在配置中直接添加，而是在 useEffect 中通过 getPluginById 检查后添加
        setting: {
          mode: 'api',
          autoExecute: false
        }
      }}
      onError={handleError}
      ref={pluginCenterRef}
    />
  );
};

export default App;
