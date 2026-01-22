import React, { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { createPluginCenter, pluginEntity, Plugin, PluginCenterConfig } from '@plugin-center/core';
import { PluginForm } from './PluginForm';
import { PluginList } from './PluginList';
import './styles.css';

export interface PluginCenterProps {
  config?: PluginCenterConfig;
  onError?: (error: Error) => void;
}
const EXAMPLE_PLUGIN_ID = 'example-plugin';
export interface PluginCenterRef {
  getPluginCenter: () => ReturnType<typeof createPluginCenter>;
}

export const PluginCenter = forwardRef<PluginCenterRef, PluginCenterProps>(({ 
  config = {
    plugin: [],
    setting: {
      mode: 'api',
      autoExecute: true
    }
  },
  onError 
}, ref: React.ForwardedRef<PluginCenterRef>) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [pluginCenter] = useState(() => createPluginCenter(config));

  // 暴露 pluginCenter 实例给父组件
  useImperativeHandle(ref, () => ({
    getPluginCenter: () => pluginCenter,
  }), [pluginCenter]);

  // 订阅插件变化
  useEffect(() => {
    const unsubscribe = pluginEntity.subscribe((updatedPlugins) => {
      setPlugins(updatedPlugins);
    });

    // 初始加载
    setPlugins(pluginCenter.getPlugins());

    return () => {
      unsubscribe();
    };
  }, [pluginCenter]);

  // 添加插件
  const handleAddPlugin = useCallback((plugin: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>) => {
    try {
      pluginCenter.addPlugin(plugin);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('添加插件失败');
      onError?.(err);
      throw err;
    }
  }, [pluginCenter, onError]);

  // 执行插件
  const handleExecutePlugin = useCallback((pluginId: string) => {
    try {
      pluginCenter.executePlugin(pluginId);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('执行插件失败');
      onError?.(err);
      throw err;
    }
  }, [pluginCenter, onError]);

  // 执行所有启用的插件
  const handleExecuteAllEnabledPlugins = useCallback(() => {
    try {
      pluginCenter.executeAllEnabledPlugins();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('执行所有插件失败');
      onError?.(err);
    }
  }, [pluginCenter, onError]);

  // 更新插件
  const handleUpdatePlugin = useCallback((pluginId: string, updateData: Parameters<typeof pluginCenter.updatePlugin>[1]) => {
    try {
      pluginCenter.updatePlugin(pluginId, updateData);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('更新插件失败');
      onError?.(err);
      throw err;
    }
  }, [pluginCenter, onError]);

  // 删除插件
  const handleDeletePlugin = useCallback((pluginId: string) => {
    try {
      const success = pluginCenter.deletePlugin(pluginId);
      if (!success) {
        throw new Error('删除失败');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('删除插件失败');
      onError?.(err);
      throw err;
    }
  }, [pluginCenter, onError]);

  const stats = pluginCenter.getPluginStats();

  useEffect(() => {
        const { test } = pluginCenter.importPlugin(EXAMPLE_PLUGIN_ID);
        if (typeof test === 'function') {
          console.log('✅ 导入成功，调用 test 函数:');
          test();
          console.log('✅ 验证完成！');
        }
  }, []);
  return (
    <div style={{ 
      minHeight: '100vh',
      padding: 'var(--spacing-xl)',
      background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <h1 className="title">插件中心</h1>
          <p style={{ 
            fontSize: '17px', 
            color: 'var(--text-secondary)',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            管理和执行您的自定义插件
          </p>
        </div>

        {/* 统计信息 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)'
        }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              总插件数
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--accent-green)' }}>
              {stats.enabled}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              已启用
            </div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-tertiary)' }}>
              {stats.disabled}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
              已禁用
            </div>
          </div>
        </div>

        {/* 添加插件表单 */}
        <div className="card fade-in" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 className="subtitle" style={{ marginBottom: 'var(--spacing-lg)' }}>添加新插件</h2>
          <PluginForm onSubmit={handleAddPlugin} onError={onError} />
        </div>

        {/* 操作栏 */}
        <div style={{ 
          marginBottom: 'var(--spacing-lg)',
          display: 'flex',
          gap: 'var(--spacing-md)',
          alignItems: 'center'
        }}>
          <button
            onClick={handleExecuteAllEnabledPlugins}
            className="btn btn-success"
            disabled={stats.enabled === 0}
            style={{
              opacity: stats.enabled === 0 ? 0.5 : 1,
              cursor: stats.enabled === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            执行所有启用的插件 ({stats.enabled})
          </button>
        </div>

        {/* 插件列表 */}
        <div>
          <h2 className="subtitle" style={{ marginBottom: 'var(--spacing-lg)' }}>
            插件列表
            <span style={{ 
              fontSize: '16px', 
              fontWeight: '400', 
              color: 'var(--text-secondary)',
              marginLeft: 'var(--spacing-sm)'
            }}>
              ({plugins.length})
            </span>
          </h2>
          <PluginList
            plugins={plugins}
            onExecute={handleExecutePlugin}
            onUpdate={handleUpdatePlugin}
            onDelete={handleDeletePlugin}
          />
        </div>
      </div>
    </div>
  );
});
