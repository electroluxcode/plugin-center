import { createStore } from 'zustand/vanilla';
import { Plugin } from './types';

// 插件状态接口
interface PluginState {
  plugins: Plugin[];
}

// 插件操作接口
interface PluginActions {
  setPlugins: (plugins: Plugin[]) => void;
  addPlugin: (plugin: Plugin) => void;
  updatePlugin: (id: string, updateData: Partial<Plugin>) => void;
  deletePlugin: (id: string) => boolean;
  clearPlugins: () => void;
  getPluginById: (id: string) => Plugin | undefined;
}

// 创建 zustand store (使用 vanilla 版本，不需要 React)
const usePluginStore = createStore<PluginState & PluginActions>()((set, get) => ({
  plugins: [],

  setPlugins: (plugins: Plugin[]) => {
    set({ plugins });
  },

  addPlugin: (plugin: Plugin) => {
    set((state: PluginState) => ({
      plugins: [...state.plugins, plugin],
    }));
  },

  updatePlugin: (id: string, updateData: Partial<Plugin>) => {
    set((state: PluginState) => ({
      plugins: state.plugins.map((plugin: Plugin) =>
        plugin.id === id
          ? {
              ...plugin,
              ...updateData,
              updatedAt: Date.now(),
            }
          : plugin
      ),
    }));
  },

  deletePlugin: (id: string) => {
    const plugin = get().getPluginById(id);
    if (!plugin) {
      return false;
    }
    set((state: PluginState) => ({
      plugins: state.plugins.filter((p: Plugin) => p.id !== id),
    }));
    return true;
  },

  clearPlugins: () => {
    set({ plugins: [] });
  },

  getPluginById: (id: string) => {
    return get().plugins.find((p: Plugin) => p.id === id);
  },
}));

// 为了保持向后兼容，创建一个适配类
class PluginEntity {
  /**
   * 设置插件列表
   */
  setPlugins(plugins: Plugin[]): void {
    usePluginStore.getState().setPlugins(plugins);
  }

  /**
   * 获取插件列表
   */
  getPlugins(): Plugin[] {
    return usePluginStore.getState().plugins;
  }

  /**
   * 添加插件
   */
  addPlugin(plugin: Plugin): void {
    usePluginStore.getState().addPlugin(plugin);
  }

  /**
   * 根据 ID 获取插件
   */
  getPluginById(id: string): Plugin | undefined {
    return usePluginStore.getState().getPluginById(id);
  }

  /**
   * 更新插件
   */
  updatePlugin(id: string, updateData: Partial<Plugin>): void {
    usePluginStore.getState().updatePlugin(id, updateData);
  }

  /**
   * 删除插件
   */
  deletePlugin(id: string): boolean {
    return usePluginStore.getState().deletePlugin(id);
  }

  /**
   * 清空所有插件
   */
  clearPlugins(): void {
    usePluginStore.getState().clearPlugins();
  }

  /**
   * 订阅插件变化（使用 zustand 的 subscribe）
   */
  subscribe(listener: (plugins: Plugin[]) => void): () => void {
    let prevPlugins = usePluginStore.getState().plugins;
    return usePluginStore.subscribe((state) => {
      const currentPlugins = state.plugins;
      if (currentPlugins !== prevPlugins) {
        prevPlugins = currentPlugins;
        listener(currentPlugins);
      }
    });
  }
}

const pluginEntity = new PluginEntity();
export default pluginEntity;

// 导出 zustand store，供需要响应式更新的地方使用
export { usePluginStore };
