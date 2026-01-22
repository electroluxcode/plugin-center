import { Plugin, PluginQuery, PluginUpdate, PluginStats, PluginExecutionContext } from './types';
import pluginEntity from './plugin.entity';
import { parsePluginMetadata, validatePlugin, generateId, checkUrlMatch, PLUGIN_STORAGE_KEY } from './plugin-utils';

/**
 * @description 插件服务层，用于管理插件的本地存储、导出导入和业务逻辑
 */
class PluginService {
  // ========== 本地存储相关 ==========

  /**
   * 保存插件列表到本地存储
   */
  savePlugins(plugins: Plugin[]): void {
    try {
      const data = JSON.stringify(plugins);
      localStorage.setItem(PLUGIN_STORAGE_KEY, data);
    } catch (error) {
      console.error('保存插件数据失败:', error);
    }
  }

  /**
   * 从本地存储读取插件列表
   */
  loadPluginsFromStorage(): Plugin[] {
    try {
      const data = localStorage.getItem(PLUGIN_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('读取插件数据失败:', error);
    }
    return [];
  }

  /**
   * 清空本地存储
   */
  clearPlugins(): void {
    try {
      localStorage.removeItem(PLUGIN_STORAGE_KEY);
    } catch (error) {
      console.error('清空插件数据失败:', error);
    }
  }

  /**
   * 导出插件配置为 JSON 字符串
   */
  exportPlugins(plugins: Plugin[]): string {
    try {
      return JSON.stringify(plugins, null, 2);
    } catch (error) {
      console.error('导出插件配置失败:', error);
      return '[]';
    }
  }

  /**
   * 从 JSON 字符串导入插件配置
   */
  importPlugins(jsonString: string): Plugin[] {
    try {
      const plugins = JSON.parse(jsonString);
      if (Array.isArray(plugins)) {
        return plugins;
      }
      return [];
    } catch (error) {
      console.error('导入插件配置失败:', error);
      return [];
    }
  }

  // ========== 插件业务逻辑 ==========

  /**
   * 添加插件（适配层：处理数据转化和逻辑判断）
   */
  addPlugin(pluginData: Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>): Plugin {
    // 验证插件内容
    const validation = validatePlugin(pluginData.content);
    if (!validation.valid) {
      throw new Error(validation.error || '插件验证失败');
    }

    // 解析元数据
    const metadata = parsePluginMetadata(pluginData.content);
    
    // 如果元数据中有 name，使用元数据的 name（优先级更高）
    const finalName = metadata.name || pluginData.name;
    
    // 如果元数据中有 icon，使用元数据的 icon
    const finalIcon = metadata.icon || pluginData.icon;

    // 生成插件对象
    const plugin: Plugin = {
      id: generateId(),
      name: finalName,
      icon: finalIcon,
      description: metadata.description || pluginData.description,
      enabled: pluginData.enabled,
      allowDelete: pluginData.allowDelete !== undefined ? pluginData.allowDelete : true,
      content: pluginData.content,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 更新实体
    pluginEntity.addPlugin(plugin);
    
    // 保存到本地存储
    this.savePlugins(pluginEntity.getPlugins());

    return plugin;
  }

  /**
   * 删除插件
   */
  deletePlugin(pluginId: string): boolean {
    const plugin = pluginEntity.getPluginById(pluginId);
    if (!plugin) {
      return false;
    }

    if (!plugin.allowDelete) {
      throw new Error('该插件不允许删除');
    }

    const result = pluginEntity.deletePlugin(pluginId);
    if (result) {
      this.savePlugins(pluginEntity.getPlugins());
    }
    return result;
  }

  /**
   * 更新插件
   */
  updatePlugin(pluginId: string, updateData: PluginUpdate): Plugin {
    const plugin = pluginEntity.getPluginById(pluginId);
    if (!plugin) {
      throw new Error('插件不存在');
    }

    // 如果更新了 content，需要重新解析元数据
    if (updateData.content) {
      const validation = validatePlugin(updateData.content);
      if (!validation.valid) {
        throw new Error(validation.error || '插件验证失败');
      }

      const metadata = parsePluginMetadata(updateData.content);
      updateData.metadata = metadata;
      
      // 如果元数据中有 name，更新 name
      if (metadata.name) {
        updateData.name = metadata.name;
      }
      
      // 如果元数据中有 description，更新 description
      if (metadata.description) {
        updateData.description = metadata.description;
      }
      
      // 如果元数据中有 icon，更新 icon
      if (metadata.icon) {
        updateData.icon = metadata.icon;
      }
    }

    pluginEntity.updatePlugin(pluginId, {
      ...updateData,
      updatedAt: Date.now(),
    });

    const updatedPlugin = pluginEntity.getPluginById(pluginId)!;
    this.savePlugins(pluginEntity.getPlugins());

    return updatedPlugin;
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): Plugin | null {
    return pluginEntity.getPluginById(pluginId) || null;
  }

  /**
   * 查询插件列表（适配层：数据筛选）
   */
  getPlugins(query?: PluginQuery): Plugin[] {
    let plugins = pluginEntity.getPlugins();

    if (!query) {
      return plugins;
    }

    // 按 ID 精确查询
    if (query.id) {
      return plugins.filter((p: Plugin) => p.id === query.id);
    }

    // 按名称模糊查询
    if (query.name) {
      const nameLower = query.name.toLowerCase();
      plugins = plugins.filter((p: Plugin) => 
        p.name.toLowerCase().includes(nameLower) ||
        p.description.toLowerCase().includes(nameLower)
      );
    }

    // 按启用状态筛选
    if (query.enabled !== undefined) {
      plugins = plugins.filter((p: Plugin) => p.enabled === query.enabled);
    }

    return plugins;
  }

  /**
   * 启用插件
   */
  enablePlugin(pluginId: string): boolean {
    const plugin = pluginEntity.getPluginById(pluginId);
    if (!plugin) {
      return false;
    }

    pluginEntity.updatePlugin(pluginId, { enabled: true });
    this.savePlugins(pluginEntity.getPlugins());
    return true;
  }

  /**
   * 禁用插件
   */
  disablePlugin(pluginId: string): boolean {
    const plugin = pluginEntity.getPluginById(pluginId);
    if (!plugin) {
      return false;
    }

    pluginEntity.updatePlugin(pluginId, { enabled: false });
    this.savePlugins(pluginEntity.getPlugins());
    return true;
  }

  /**
   * 切换插件启用状态
   */
  togglePlugin(pluginId: string): boolean {
    const plugin = pluginEntity.getPluginById(pluginId);
    if (!plugin) {
      return false;
    }

    const newEnabled = !plugin.enabled;
    pluginEntity.updatePlugin(pluginId, { enabled: newEnabled });
    this.savePlugins(pluginEntity.getPlugins());
    return newEnabled;
  }

  /**
   * 批量添加插件
   */
  batchAddPlugins(plugins: Array<Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>>): Plugin[] {
    const addedPlugins: Plugin[] = [];
    for (const pluginData of plugins) {
      try {
        const plugin = this.addPlugin(pluginData);
        addedPlugins.push(plugin);
      } catch (error) {
        console.error('批量添加插件失败:', error);
      }
    }
    return addedPlugins;
  }

  /**
   * 批量删除插件
   */
  batchDeletePlugins(pluginIds: string[]): { success: string[]; failed: string[] } {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of pluginIds) {
      try {
        if (this.deletePlugin(id)) {
          success.push(id);
        } else {
          failed.push(id);
        }
      } catch (error) {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * 批量更新插件
   */
  batchUpdatePlugins(updates: Array<{ id: string; data: PluginUpdate }>): Plugin[] {
    const updatedPlugins: Plugin[] = [];
    for (const { id, data } of updates) {
      try {
        const plugin = this.updatePlugin(id, data);
        updatedPlugins.push(plugin);
      } catch (error) {
        console.error(`更新插件 ${id} 失败:`, error);
      }
    }
    return updatedPlugins;
  }

  /**
   * 获取插件统计信息
   */
  getPluginStats(): PluginStats {
    const plugins = pluginEntity.getPlugins();
    return {
      total: plugins.length,
      enabled: plugins.filter((p: Plugin) => p.enabled).length,
      disabled: plugins.filter((p: Plugin) => !p.enabled).length,
      deletable: plugins.filter((p: Plugin) => p.allowDelete).length,
    };
  }

  /**
   * 清空所有插件
   */
  clearAllPlugins(): boolean {
    pluginEntity.clearPlugins();
    this.clearPlugins();
    return true;
  }

  /**
   * 初始化插件列表（从本地存储加载）
   */
  initPlugins(): void {
    const storedPlugins = this.loadPluginsFromStorage();
    if (storedPlugins.length > 0) {
      pluginEntity.setPlugins(storedPlugins);
    }
  }

  /**
   * 执行插件代码
   */
  private executePluginCode(code: string, context: PluginExecutionContext): void {
    // 使用 new Function 创建函数来执行代码，提供执行上下文
    const func = new Function(
      'pluginId',
      'pluginName',
      'url',
      'timestamp',
      `
      (function() {
        'use strict';
        ${code}
      })();
      `
    );

    func(
      context.pluginId,
      context.pluginName,
      context.url,
      context.timestamp
    );
  }

  /**
   * 执行插件（根据 match 规则匹配 URL）
   */
  executePlugin(pluginId: string, targetUrl?: string): void {
    const plugin = pluginEntity.getPluginById(pluginId);
    if (!plugin) {
      throw new Error('插件不存在');
    }

    if (!plugin.enabled) {
      return; // 未启用的插件不执行
    }

    // 检查 URL 匹配
    const currentUrl = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
    if (plugin.metadata?.match && plugin.metadata.match.length > 0) {
      if (!checkUrlMatch(plugin.metadata.match, currentUrl)) {
        return; // URL 不匹配，不执行
      }
    }

    const context: PluginExecutionContext = {
      pluginId: plugin.id,
      pluginName: plugin.name,
      url: currentUrl,
      timestamp: Date.now(),
    };

    try {
      // 执行插件代码
      this.executePluginCode(plugin.content, context);
    } catch (error) {
      throw new Error(`插件执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 执行所有启用的插件（根据 match 规则匹配当前 URL）
   */
  executeAllEnabledPlugins(targetUrl?: string): void {
    const enabledPlugins = this.getPlugins({ enabled: true });
    for (const plugin of enabledPlugins) {
      try {
        this.executePlugin(plugin.id, targetUrl);
      } catch (error) {
        console.error(`执行插件 ${plugin.name} 失败:`, error);
      }
    }
  }

  /**
   * 检查插件是否匹配指定 URL
   */
  checkPluginMatch(pluginId: string, targetUrl?: string): boolean {
    const plugin = pluginEntity.getPluginById(pluginId);
    if (!plugin || !plugin.metadata?.match || plugin.metadata.match.length === 0) {
      return true; // 没有匹配规则，默认匹配所有
    }

    const url = targetUrl || (typeof window !== 'undefined' ? window.location.href : '');
    return checkUrlMatch(plugin.metadata.match, url);
  }
}

const pluginService = new PluginService();
export default pluginService;
