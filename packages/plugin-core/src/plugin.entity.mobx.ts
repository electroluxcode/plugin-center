import { makeAutoObservable, autorun, IReactionDisposer } from 'mobx';
import { Plugin } from './types';

// 使用 MobX 管理插件状态
class PluginStore {
  plugins: Plugin[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * 设置插件列表
   */
  setPlugins(plugins: Plugin[]): void {
    this.plugins = plugins;
  }

  /**
   * 添加插件
   */
  addPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  /**
   * 更新插件
   */
  updatePlugin(id: string, updateData: Partial<Plugin>): void {
    const index = this.plugins.findIndex((p) => p.id === id);
    if (index !== -1) {
      // 使用 splice 替换元素，确保 MobX 能检测到变化
      // 直接赋值 this.plugins[index] = {...} 可能不会触发响应式更新
      const updatedPlugin = {
        ...this.plugins[index],
        ...updateData,
        updatedAt: Date.now(),
      };
      this.plugins.splice(index, 1, updatedPlugin);
    }
  }

  /**
   * 删除插件
   */
  deletePlugin(id: string): boolean {
    const index = this.plugins.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.plugins.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 清空所有插件
   */
  clearPlugins(): void {
    this.plugins = [];
  }

  /**
   * 根据 ID 获取插件
   */
  getPluginById(id: string): Plugin | undefined {
    return this.plugins.find((p) => p.id === id);
  }
}

// 创建全局 store 实例
const pluginStore = new PluginStore();

// 为了保持向后兼容，创建一个适配类
class PluginEntity {
  /**
   * 设置插件列表
   */
  setPlugins(plugins: Plugin[]): void {
    pluginStore.setPlugins(plugins);
  }

  /**
   * 获取插件列表
   */
  getPlugins(): Plugin[] {
    return pluginStore.plugins;
  }

  /**
   * 添加插件
   */
  addPlugin(plugin: Plugin): void {
    pluginStore.addPlugin(plugin);
  }

  /**
   * 根据 ID 获取插件
   */
  getPluginById(id: string): Plugin | undefined {
    return pluginStore.getPluginById(id);
  }

  /**
   * 更新插件
   */
  updatePlugin(id: string, updateData: Partial<Plugin>): void {
    pluginStore.updatePlugin(id, updateData);
  }

  /**
   * 删除插件
   */
  deletePlugin(id: string): boolean {
    return pluginStore.deletePlugin(id);
  }

  /**
   * 清空所有插件
   */
  clearPlugins(): void {
    pluginStore.clearPlugins();
  }

  /**
   * 订阅插件变化（使用 MobX 的 autorun）
   * 
   * 根据 MobX 最佳实践：
   * 1. autorun 会自动追踪函数内访问的所有 observable
   * 2. 需要访问数组的属性（如 length）或使用 slice/spread 来建立依赖
   * 3. 对于数组元素变化，访问元素属性可以建立追踪
   */
  subscribe(listener: (plugins: Plugin[]) => void): () => void {
    // 使用 autorun 自动追踪所有访问的 observable
    const disposer: IReactionDisposer = autorun(() => {
      const plugins = pluginStore.plugins;
      
      // 使用 slice 或 spread 创建新数组，这会访问所有元素
      // 确保数组元素的变化（包括替换）能被追踪
      const pluginsCopy = plugins.slice();
      
      // 传递数组副本给 listener
      listener(pluginsCopy);
    });

    // 返回取消订阅的函数
    return () => {
      disposer();
    };
  }
}

const pluginEntity = new PluginEntity();
export default pluginEntity;

// 导出 MobX store，供需要响应式更新的地方使用
export { pluginStore };
