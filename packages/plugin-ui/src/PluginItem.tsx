import React, { useState } from 'react';
import { Plugin, PluginUpdate } from '@plugin-center/core';

export interface PluginItemProps {
  plugin: Plugin;
  onExecute: (pluginId: string) => void;
  onUpdate: (pluginId: string, updateData: PluginUpdate) => void;
  onDelete: (pluginId: string) => void;
}

export const PluginItem: React.FC<PluginItemProps> = ({ plugin, onExecute, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editContent, setEditContent] = useState(plugin.content);
  const [editEnabled, setEditEnabled] = useState(plugin.enabled);

  const handleExecute = () => {
    try {
      onExecute(plugin.id);
    } catch (error) {
      console.error('执行插件失败:', error);
    }
  };

  const handleUpdate = () => {
    try {
      onUpdate(plugin.id, {
        content: editContent.trim(),
        enabled: editEnabled,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('更新插件失败:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(plugin.content);
    setEditEnabled(plugin.enabled);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    try {
      onDelete(plugin.id);
    } catch (error) {
      console.error('删除插件失败:', error);
      setIsDeleting(false);
    }
  };


  // 转义 HTML 防止 XSS
  const escapeHtml = (text: string) => {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card" style={{ 
      opacity: isDeleting ? 0.5 : 1,
      transition: 'opacity 0.3s'
    }}>
      {/* 头部 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--spacing-md)'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-xs)'
          }}>
            <h3 className="heading" style={{ margin: 0 }}>
              {escapeHtml(plugin.name || plugin.id)}
            </h3>
            <span style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: '500',
              background: plugin.enabled 
                ? 'rgba(52, 199, 89, 0.2)' 
                : 'rgba(142, 142, 147, 0.2)',
              color: plugin.enabled 
                ? 'var(--accent-green)' 
                : 'var(--text-tertiary)'
            }}>
              {plugin.enabled ? '✓ 已启用' : '○ 已禁用'}
            </span>
          </div>
          
          {plugin.description && (
            <p style={{ 
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              {escapeHtml(plugin.description)}
            </p>
          )}

          {/* 元数据 */}
          {plugin.metadata && (
            <div style={{ 
              marginTop: 'var(--spacing-sm)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-sm)',
              fontSize: '12px',
              color: 'var(--text-tertiary)'
            }}>
              {plugin.metadata.version && (
                <span>版本: {plugin.metadata.version}</span>
              )}
              {plugin.metadata.author && (
                <span>作者: {plugin.metadata.author}</span>
              )}
              {plugin.metadata.match && plugin.metadata.match.length > 0 && (
                <span>匹配: {plugin.metadata.match.length} 个规则</span>
              )}
            </div>
          )}

          {/* 时间信息 */}
          <div style={{ 
            marginTop: 'var(--spacing-xs)',
            fontSize: '12px',
            color: 'var(--text-tertiary)'
          }}>
            创建于 {formatDate(plugin.createdAt)} · 更新于 {formatDate(plugin.updatedAt)}
          </div>
        </div>
      </div>

      {/* 编辑表单 */}
      {isEditing && (
        <div style={{ 
          marginTop: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-md)',
          padding: 'var(--spacing-lg)',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="label">插件代码</label>
            <textarea
              className="textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={15}
              placeholder="请输入插件代码内容"
            />
          </div>

          <div style={{ 
            marginBottom: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}>
            <input
              type="checkbox"
              id={`enabled-${plugin.id}`}
              checked={editEnabled}
              onChange={(e) => setEditEnabled(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label 
              htmlFor={`enabled-${plugin.id}`}
              style={{ 
                fontSize: '14px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              启用插件
            </label>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-md)',
            justifyContent: 'flex-end'
          }}>
            <button 
              onClick={handleCancelEdit}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button 
              onClick={handleUpdate}
              className="btn btn-primary"
            >
              保存
            </button>
          </div>
        </div>
      )}


      {/* 操作按钮 */}
      <div style={{ 
        display: 'flex',
        gap: 'var(--spacing-sm)',
        flexWrap: 'wrap',
        paddingTop: 'var(--spacing-md)',
        borderTop: '1px solid var(--border-color)'
      }}>
        <button
          onClick={handleExecute}
          className="btn btn-primary"
          disabled={!plugin.enabled || isEditing}
          style={{
            opacity: plugin.enabled && !isEditing ? 1 : 0.5,
            cursor: plugin.enabled && !isEditing ? 'pointer' : 'not-allowed'
          }}
        >
          执行
        </button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn btn-secondary"
          disabled={isDeleting}
        >
          {isEditing ? '取消编辑' : '编辑'}
        </button>

        {plugin.allowDelete && (
          <button
            onClick={handleDelete}
            className="btn btn-danger"
            disabled={isDeleting || isEditing}
            style={{ marginLeft: 'auto' }}
          >
            {isDeleting ? '删除中...' : '删除'}
          </button>
        )}
      </div>
    </div>
  );
};
