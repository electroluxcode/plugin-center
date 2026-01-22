import React from 'react';
import { Plugin, PluginUpdate } from '@plugin-center/core';
import { PluginItem } from './PluginItem';

export interface PluginListProps {
  plugins: Plugin[];
  onExecute: (pluginId: string) => void;
  onUpdate: (pluginId: string, updateData: PluginUpdate) => void;
  onDelete: (pluginId: string) => void;
}

export const PluginList: React.FC<PluginListProps> = ({ plugins, onExecute, onUpdate, onDelete }) => {
  if (plugins.length === 0) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">📦</div>
        <p style={{ fontSize: '17px', marginBottom: 'var(--spacing-xs)' }}>
          暂无插件
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
          点击上方"添加新插件"开始创建您的第一个插件
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid',
      gap: 'var(--spacing-md)'
    }}>
      {plugins.map((plugin, index) => (
        <div key={plugin.id} className="fade-in" style={{ 
          animationDelay: `${index * 0.05}s` 
        }}>
          <PluginItem
            plugin={plugin}
            onExecute={onExecute}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
};
