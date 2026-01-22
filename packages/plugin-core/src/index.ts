// 导出所有类型
export * from './types';

// 导出核心类
export { default as FrontPluginCenter, createPluginCenter } from './plugin-core';
// 同时导出默认导出（为了兼容性）
export { default } from './plugin-core';

// 导出工具函数
export * from './plugin-utils';

// 导出内部模块（供高级用法）
// @ts-ignore
export { default as pluginEntity } from './plugin.entity';
export { default as pluginService } from './plugin.service';
