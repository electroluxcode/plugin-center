// 插件元数据类型（从 UserScript 头部解析）
export type PluginMetadata = {
  name?: string;           // @name
  namespace?: string;      // @namespace
  version?: string;        // @version
  description?: string;    // @description
  author?: string;         // @author
  match?: string[];        // @match (支持多个)
  icon?: string;          // @icon
  [key: string]: any;     // 其他元数据
}

// 插件完整类型
export type Plugin = {
  id: string;             // 插件唯一标识（自动生成）
  name: string;
  icon?: string;
  description: string;
  enabled: boolean;
  allowDelete: boolean;
  content: string;
  metadata?: PluginMetadata;  // 解析后的元数据
  createdAt?: number;     // 创建时间戳
  updatedAt?: number;      // 更新时间戳
}

// 插件查询条件
export type PluginQuery = {
  name?: string;          // 按名称模糊查询
  enabled?: boolean;      // 按启用状态筛选
  id?: string;            // 按ID精确查询
}

// 插件更新数据（部分字段）
export type PluginUpdate = Partial<Omit<Plugin, 'id' | 'createdAt'>> & {
  updatedAt?: number;
}

// 插件执行时的上下文环境
export type PluginExecutionContext = {
  pluginId: string;       // 当前执行的插件ID
  pluginName: string;     // 当前执行的插件名称
  url: string;            // 当前页面URL
  timestamp: number;      // 执行时间戳
}

// 插件执行器配置
export type PluginExecutorConfig = {
  timeout?: number;        // 执行超时时间（毫秒，默认 5000）
  onError?: (error: Error, context: PluginExecutionContext) => void;  // 错误回调
}

// 错误类型定义
export type PluginError = {
  code: string;           // 错误代码
  message: string;        // 错误信息
  pluginId?: string;      // 关联的插件ID（如果有）
  timestamp: number;      // 错误发生时间
}

// 错误代码枚举
export enum PluginErrorCode {
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_INVALID = 'PLUGIN_INVALID',
  PLUGIN_EXECUTION_FAILED = 'PLUGIN_EXECUTION_FAILED',
  PLUGIN_DELETE_FORBIDDEN = 'PLUGIN_DELETE_FORBIDDEN',
  PLUGIN_METADATA_PARSE_ERROR = 'PLUGIN_METADATA_PARSE_ERROR',
  CONFIG_INVALID = 'CONFIG_INVALID'
}

// 插件中心配置
export type PluginCenterConfig = {
  plugin: Array<Omit<Plugin, 'id' | 'createdAt' | 'updatedAt' | 'metadata'>>;
  setting: {
    mode: "api" | "list";
    id?: string;          // list 模式下挂载的 DOM 元素 ID
    autoExecute?: boolean; // 是否在初始化时自动执行所有启用的插件，默认为 true
  };
}

// 插件事件类型
export type PluginEventType = 
  | 'pluginAdded' 
  | 'pluginDeleted' 
  | 'pluginUpdated' 
  | 'pluginEnabled' 
  | 'pluginDisabled' 
  | 'pluginExecuted';

// 插件统计信息
export type PluginStats = {
  total: number;          // 插件总数
  enabled: number;        // 启用的插件数
  disabled: number;       // 禁用的插件数
  deletable: number;      // 可删除的插件数
}
