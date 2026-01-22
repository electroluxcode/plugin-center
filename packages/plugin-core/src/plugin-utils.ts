import { PluginMetadata } from './types';

/**
 * localStorage 存储键名
 */
export const PLUGIN_STORAGE_KEY = 'front_plugin_center_plugins';

/**
 * 解析 UserScript 元数据
 * 从插件 content 中解析 // ==UserScript== 和 // ==/UserScript== 之间的内容
 */
export function parsePluginMetadata(content: string): PluginMetadata {
  const metadata: PluginMetadata = {};
  
  // 匹配 UserScript 头部
  const userScriptMatch = content.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/);
  
  if (!userScriptMatch) {
    return metadata;
  }
  
  const headerContent = userScriptMatch[1];
  const lines = headerContent.split('\n');
  
  for (const line of lines) {
    // 匹配 @key value 格式
    const match = line.match(/\/\/\s*@(\w+)\s+(.+)/);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      
      // 处理数组类型的元数据（如 @match, @grant）
      if (key === 'match' || key === 'grant') {
        if (!metadata[key]) {
          metadata[key] = [];
        }
        (metadata[key] as string[]).push(value);
      } else {
        metadata[key] = value;
      }
    }
  }
  
  return metadata;
}

/**
 * 验证插件内容格式
 */
export function validatePlugin(content: string): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: '插件内容不能为空' };
  }
  
  // 检查是否包含 UserScript 头部（可选，但推荐）
  const hasUserScriptHeader = /\/\/\s*==UserScript==/.test(content);
  
  if (!hasUserScriptHeader) {
    // 警告但不阻止，允许没有头部的插件
    console.warn('插件内容缺少 UserScript 头部元数据');
  }
  
  // 尝试解析元数据，检查是否有语法错误
  try {
    parsePluginMetadata(content);
  } catch (error) {
    return { valid: false, error: `元数据解析失败: ${error}` };
  }
  
  return { valid: true };
}

/**
 * 检查 URL 是否匹配插件的 @match 规则
 * 支持通配符匹配，类似 Tampermonkey 的匹配规则
 */
export function checkUrlMatch(matchPatterns: string[], url: string): boolean {
  if (!matchPatterns || matchPatterns.length === 0) {
    return true; // 没有匹配规则，默认匹配所有
  }
  
  for (const pattern of matchPatterns) {
    if (matchUrl(pattern, url)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 匹配单个 URL 模式
 * 支持通配符 * 和协议/域名/路径匹配
 */
function matchUrl(pattern: string, url: string): boolean {
  try {
    // 将通配符模式转换为正则表达式
    // * 匹配任意字符（除了路径分隔符）
    // ** 匹配任意字符（包括路径分隔符）
    let regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/\*\*/g, '.*')                 // ** 匹配任意字符
      .replace(/\*/g, '[^/]*');               // * 匹配除 / 外的任意字符
    
    // 如果模式不以 * 开头，添加 ^ 锚点
    if (!pattern.startsWith('*')) {
      regexPattern = '^' + regexPattern;
    }
    
    // 如果模式不以 * 结尾，添加 $ 锚点
    if (!pattern.endsWith('*')) {
      regexPattern = regexPattern + '$';
    }
    
    const regex = new RegExp(regexPattern);
    return regex.test(url);
  } catch (error) {
    console.error('URL 匹配模式错误:', pattern, error);
    return false;
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取插件首字母（用于默认图标）
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';
  return trimmed.charAt(0).toUpperCase();
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 格式化日期
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) {
    return '刚刚';
  } else if (hours < 24) {
    return `${hours} h`;
  } else if (days < 7) {
    return `${days} 天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  }
}

/**
 * 获取插件大小（字节）
 */
export function getPluginSize(content: string): number {
  return new Blob([content]).size;
}
