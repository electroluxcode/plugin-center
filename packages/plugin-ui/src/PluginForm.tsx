import React, { useState } from 'react';
import { Plugin } from '@plugin-center/core';

export interface PluginFormProps {
  onSubmit: (plugin: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>) => void;
  onError?: (error: Error) => void;
}

// 示例内容
const EXAMPLE_CONTENT = `// ==UserScript==
// @name         示例插件
// @description  这是一个示例插件，展示如何创建自定义功能
// @match        https://example.com/*
// ==/UserScript==

(function() {
    'use strict';
    
    // 您的插件代码
    console.log('插件已加载！');
    
    // 示例：修改页面标题
    document.title = '插件已激活 - ' + document.title;
    
    // 示例：添加样式
    const style = document.createElement('style');
    style.textContent = \`
        body {
            border-top: 3px solid #007aff;
        }
    \`;
    document.head.appendChild(style);
})();`;

export const PluginForm: React.FC<PluginFormProps> = ({ onSubmit, onError }) => {
  const [content, setContent] = useState('');
  const [showExample, setShowExample] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      onError?.(new Error('请输入插件内容'));
      return;
    }

    try {
      onSubmit({
        name: '',
        description: '',
        content: content.trim(),
        enabled: true,
        allowDelete: true,
      });

      // 清空表单
      setContent('');
      setShowExample(false);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('添加失败'));
    }
  };

  const handleLoadExample = () => {
    setContent(EXAMPLE_CONTENT);
    setShowExample(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 'var(--spacing-sm)'
        }}>
          <label className="label" style={{ marginBottom: 0 }}>插件代码</label>
          <button
            type="button"
            onClick={handleLoadExample}
            className="btn btn-secondary"
            style={{ 
              padding: '6px 12px',
              fontSize: '12px'
            }}
          >
            {showExample ? '✓ 已加载示例' : '📝 加载示例'}
          </button>
        </div>
        <textarea
          className="textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          placeholder="请输入插件代码内容（支持 UserScript 格式）"
          required
        />
        <div style={{ 
          marginTop: 'var(--spacing-xs)',
          fontSize: '12px',
          color: 'var(--text-tertiary)'
        }}>
          支持 UserScript 格式，可以使用 @name、@description、@match 等元数据
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-md)',
        justifyContent: 'flex-end'
      }}>
        <button 
          type="button"
          onClick={() => {
            setContent('');
            setShowExample(false);
          }}
          className="btn btn-secondary"
        >
          清空
        </button>
        <button type="submit" className="btn btn-primary">
          添加插件
        </button>
      </div>
    </form>
  );
};
