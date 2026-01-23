import {
  Plugin,
  PluginQuery,
  PluginUpdate,
  PluginCenterConfig,
  PluginEventType,
  PluginError,
  PluginErrorCode,
  PluginStats,
  PluginExecutionContext,
  PluginInput,
  PluginExecutorConfig,
} from './types';
import { PluginType } from './types';
import pluginEntity from './plugin.entity';
import pluginService from './plugin.service';
import { parsePluginMetadata, validatePlugin, checkUrlMatch } from './plugin.utils';

class FrontPluginCenter {
  private static instance: FrontPluginCenter | null = null;
  private config: PluginCenterConfig;
  private errorHandler?: (error: PluginError) => void;
  private errorHistory: PluginError[] = [];
  private executorConfig: PluginExecutorConfig = {
    timeout: 5000,
  };
  private eventListeners: Map<PluginEventType, Set<(plugin: Plugin) => void>> = new Map();

  private constructor(config: PluginCenterConfig) {
    this.config = config;
    this.init();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: PluginCenterConfig): FrontPluginCenter {
    if (!FrontPluginCenter.instance) {
      if (!config) {
        throw new Error('首次调用需要提供配置');
      }
      FrontPluginCenter.instance = new FrontPluginCenter(config);
    }
    return FrontPluginCenter.instance;
  }

  /**
   * 初始化
   */
  private init(): void {
    // 从本地存储加载插件
    pluginService.initPlugins();

    // 初始化配置中的插件
    if (this.config.plugin && this.config.plugin.length > 0) {
      pluginService.batchAddPlugins(this.config.plugin);
    }

    // 根据配置决定是否自动执行所有启用的插件（默认为 true）
    const autoExecute = this.config.setting.autoExecute !== false;
    if (autoExecute) {
      this.executeAllEnabledPlugins();
    }
  }

  // ========== 插件增删改查 ==========

  /**
   * 添加插件
   */
  addPlugin(plugin: PluginInput): Plugin {
    try {
      const newPlugin = pluginService.addPlugin(plugin);
      this.emit('pluginAdded', newPlugin);
      return newPlugin;
    } catch (error) {
      this.handleError({
        code: PluginErrorCode.PLUGIN_INVALID,
        message: error instanceof Error ? error.message : '添加插件失败',
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * 删除插件
   */
  deletePlugin(pluginId: string): boolean {
    try {
      const plugin = pluginService.getPlugin(pluginId);
      if (!plugin) {
        throw new Error('插件不存在');
      }

      if (!plugin.allowDelete) {
        throw new Error('该插件不允许删除');
      }

      const result = pluginService.deletePlugin(pluginId);
      if (result) {
        this.emit('pluginDeleted', plugin);
      }
      return result;
    } catch (error) {
      this.handleError({
        code: PluginErrorCode.PLUGIN_DELETE_FORBIDDEN,
        message: error instanceof Error ? error.message : '删除插件失败',
        pluginId,
        timestamp: Date.now(),
      });
      return false;
    }
  }

  /**
   * 更新插件
   */
  updatePlugin(pluginId: string, updateData: PluginUpdate): Plugin {
    try {
      const updatedPlugin = pluginService.updatePlugin(pluginId, updateData);
      this.emit('pluginUpdated', updatedPlugin);
      return updatedPlugin;
    } catch (error) {
      this.handleError({
        code: PluginErrorCode.PLUGIN_NOT_FOUND,
        message: error instanceof Error ? error.message : '更新插件失败',
        pluginId,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * 查询插件
   */
  getPlugin(pluginId: string): Plugin | null {
    return pluginService.getPlugin(pluginId);
  }

  /**
   * 查询插件列表
   */
  getPlugins(query?: PluginQuery): Plugin[] {
    return pluginService.getPlugins(query);
  }

  /**
   * 启用插件
   */
  enablePlugin(pluginId: string): boolean {
    const result = pluginService.enablePlugin(pluginId);
    if (result) {
      const plugin = pluginService.getPlugin(pluginId);
      if (plugin) {
        this.emit('pluginEnabled', plugin);
      }
    }
    return result;
  }

  /**
   * 禁用插件
   */
  disablePlugin(pluginId: string): boolean {
    const result = pluginService.disablePlugin(pluginId);
    if (result) {
      const plugin = pluginService.getPlugin(pluginId);
      if (plugin) {
        this.emit('pluginDisabled', plugin);
      }
    }
    return result;
  }

  /**
   * 切换插件启用状态
   */
  togglePlugin(pluginId: string): boolean {
    const plugin = pluginService.getPlugin(pluginId);
    if (!plugin) {
      return false;
    }

    const newEnabled = pluginService.togglePlugin(pluginId);
    this.emit(newEnabled ? 'pluginEnabled' : 'pluginDisabled', plugin);
    return newEnabled;
  }

  // ========== 插件执行 ==========

  /**
   * 执行插件
   * 只执行类型为 script 的插件
   */
  executePlugin(pluginId: string): void {
    const plugin = pluginService.getPlugin(pluginId);
    if (!plugin) {
      throw new Error('插件不存在');
    }

    // 只执行 script 类型的插件
    if (plugin.type !== PluginType.SCRIPT) {
      console.warn(`插件 ${plugin.name} 类型为 ${plugin.type}，不执行`);
      return; // 模块插件不执行，只能通过 importPlugin 导入使用
    }

    if (!plugin.enabled) {
      return; // 未启用的插件不执行
    }

    // 检查 URL 匹配
    if (plugin.metadata?.match) {
      const currentUrl = window.location.href;
      if (!checkUrlMatch(plugin.metadata.match, currentUrl)) {
        return; // URL 不匹配，不执行
      }
    }

    const context: PluginExecutionContext = {
      pluginId: plugin.id,
      pluginName: plugin.name,
      url: window.location.href,
      timestamp: Date.now(),
    };

    try {
      // 执行插件代码
      this.executePluginCode(plugin.content, context);

      this.emit('pluginExecuted', plugin);
    } catch (error) {
      this.handleError({
        code: PluginErrorCode.PLUGIN_EXECUTION_FAILED,
        message: error instanceof Error ? error.message : '插件执行失败',
        pluginId,
        timestamp: Date.now(),
      });

      if (this.executorConfig.onError) {
        this.executorConfig.onError(error as Error, context);
      }
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
   * 获取插件的导出内容（不执行插件，只解析并返回导出）
   * 支持按需导入和默认导入
   * @example
   * const exports = pluginCenter.getPluginExports('plugin-id');
   * const test = exports.test; // 按需导入
   * const defaultExport = exports.default; // 默认导入
   */
  getPluginExports(pluginId: string): Record<string, any> {
    return pluginService.getPluginExports(pluginId);
  }

  /**
   * 导入插件（别名方法，与 getPluginExports 相同）
   * 支持类似 ES6 import 的用法
   * @example
   * const { test } = pluginCenter.importPlugin('plugin-id'); // 按需导入
   * const defaultExport = pluginCenter.importPlugin('plugin-id').default; // 默认导入
   */
  importPlugin(pluginId: string): Record<string, any> {
    return pluginService.importPlugin(pluginId);
  }

  /**
   * 执行所有启用的插件
   * 只执行类型为 script 的插件
   */
  executeAllEnabledPlugins(): void {
    const enabledPlugins = pluginService.getPlugins({ enabled: true });
    // 过滤出 script 类型的插件
    const scriptPlugins = enabledPlugins.filter(plugin => plugin.type === PluginType.SCRIPT);
    for (const plugin of scriptPlugins) {
      try {
        this.executePlugin(plugin.id);
      } catch (error) {
        console.error(`执行插件 ${plugin.name} 失败:`, error);
      }
    }
  }

  // ========== 工具方法 ==========

  /**
   * 解析插件元数据
   */
  parsePluginMetadata(content: string) {
    return parsePluginMetadata(content);
  }

  /**
   * 验证插件内容
   */
  validatePlugin(content: string) {
    return validatePlugin(content);
  }

  /**
   * 检查插件是否匹配当前页面
   */
  checkPluginMatch(pluginId: string, url?: string): boolean {
    const plugin = pluginService.getPlugin(pluginId);
    if (!plugin || !plugin.metadata?.match) {
      return false;
    }

    const targetUrl = url || window.location.href;
    return checkUrlMatch(plugin.metadata.match, targetUrl);
  }

  // ========== 批量操作 ==========

  batchAddPlugins(plugins: Array<PluginInput>): Plugin[] {
    return pluginService.batchAddPlugins(plugins);
  }

  batchDeletePlugins(pluginIds: string[]): { success: string[]; failed: string[] } {
    return pluginService.batchDeletePlugins(pluginIds);
  }

  batchUpdatePlugins(updates: Array<{ id: string; data: PluginUpdate }>): Plugin[] {
    return pluginService.batchUpdatePlugins(updates);
  }

  // ========== 事件监听 ==========

  /**
   * 监听事件
   */
  on(event: PluginEventType, callback: (plugin: Plugin) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * 取消监听
   */
  off(event: PluginEventType, callback: (plugin: Plugin) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: PluginEventType, plugin: Plugin): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(plugin);
        } catch (error) {
          console.error(`事件回调执行失败 (${event}):`, error);
        }
      });
    }
  }

  // ========== 统计信息 ==========

  /**
   * 获取插件统计信息
   */
  getPluginStats(): PluginStats {
    return pluginService.getPluginStats();
  }

  // ========== 导入导出 ==========

  /**
   * 导出插件配置
   */
  exportPlugins(): string {
    const plugins = pluginService.getPlugins();
    return pluginService.exportPlugins(plugins);
  }

  /**
   * 导入插件配置
   */
  importPlugins(jsonString: string): { success: number; failed: number; errors?: string[] } {
    try {
      const plugins = pluginService.importPlugins(jsonString);
      const added = pluginService.batchAddPlugins(plugins);
      return {
        success: added.length,
        failed: plugins.length - added.length,
      };
    } catch (error) {
      return {
        success: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : '导入失败'],
      };
    }
  }

  // ========== 配置管理 ==========

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PluginCenterConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      setting: {
        ...this.config.setting,
        ...config.setting,
      },
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): PluginCenterConfig {
    return { ...this.config };
  }

  /**
   * 切换显示模式（仅用于配置，不涉及 UI）
   */
  setMode(mode: "api" | "list", mountId?: string): void {
    this.config.setting.mode = mode;
    if (mountId) {
      this.config.setting.id = mountId;
    }
  }

  /**
   * 获取当前模式
   */
  getMode(): "api" | "list" {
    return this.config.setting.mode;
  }

  // ========== 错误处理 ==========

  /**
   * 设置错误处理器
   */
  setErrorHandler(handler: (error: PluginError) => void): void {
    this.errorHandler = handler;
  }

  /**
   * 处理错误
   */
  private handleError(error: PluginError): void {
    this.errorHistory.push(error);
    // 只保留最近 50 条错误记录
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }

    if (this.errorHandler) {
      this.errorHandler(error);
    } else {
      console.error('插件中心错误:', error);
    }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(limit?: number): PluginError[] {
    const history = [...this.errorHistory];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  // ========== 其他 ==========

  /**
   * 清空所有插件
   */
  clearAllPlugins(): boolean {
    return pluginService.clearAllPlugins();
  }

  /**
   * 获取响应式插件列表（只读）
   */
  getReactivePlugins(): ReadonlyArray<Plugin> {
    return pluginEntity.getPlugins() as ReadonlyArray<Plugin>;
  }

  /**
   * 监听插件列表变化
   */
  watchPlugins(callback: (plugins: Plugin[]) => void): () => void {
    // 使用 Proxy 监听变化
    const plugins = pluginEntity.getPlugins();
    callback(plugins);

    // 返回取消监听的函数
    return () => {
      // 取消监听逻辑
    };
  }

  /**
   * 设置执行器配置
   */
  setExecutorConfig(config: Partial<PluginExecutorConfig>): void {
    this.executorConfig = {
      ...this.executorConfig,
      ...config,
    };
  }
}

// 导出单例获取方法
export function createPluginCenter(config: PluginCenterConfig): FrontPluginCenter {
  return FrontPluginCenter.getInstance(config);
}

export default FrontPluginCenter;
