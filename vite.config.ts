import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import type { Plugin } from 'vite'
import { existsSync } from 'fs'

// 插件：处理 CSS Module Scripts (assert { type: "css" })
function cssModuleScriptsPlugin(): Plugin {
  return {
    name: 'css-module-scripts',
    enforce: 'pre',
    resolveId(id, importer) {
      // 处理带有 assert { type: "css" } 的导入，转换为 ?raw 查询参数
      if (id.endsWith('.css') && importer && !id.includes('?')) {
        // 解析实际路径
        const resolvedPath = resolve(dirname(importer), id)
        if (existsSync(resolvedPath)) {
          // 返回带 ?raw 的路径，Vite 会处理它
          return resolvedPath + '?raw'
        }
      }
      // 处理 ?inline 查询参数，也转换为 ?raw
      if (id.includes('?inline') && id.endsWith('.css')) {
        const basePath = id.replace('?inline', '')
        const resolvedPath = resolve(dirname(importer || __dirname), basePath)
        if (existsSync(resolvedPath)) {
          return resolvedPath + '?raw'
        }
      }
    },
    transform(code, id) {
      // 移除 assert { type: "css" } 语法
      if (code.includes('assert { type: "css" }') || code.includes("assert { type: 'css' }")) {
        return {
          code: code.replace(/ assert \{ type: ["']css["'] \}/g, ''),
          map: null,
        }
      }
    },
  }
}

// 从环境变量获取入口名称
const entryName = 'webzenUI'

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    host: true,
    watch: {
      // 明确追踪 src 目录下的所有文件变化
      ignored: ['!**/src/**'],
      // 使用轮询模式（在某些系统上更可靠）
      usePolling: false,
    },
    hmr: {
      // 启用热模块替换
      overlay: true,
    },
  },
  // 优化依赖预构建（开发模式下）
  optimizeDeps: {
    // 不预构建 src 下的文件，让它们实时编译
    exclude: ['src/**'],
  },
  // 构建配置
  build: {
    outDir: 'dist',
    emptyOutDir: false, // 只在第一次构建时清空
    cssCodeSplit: false, // 不拆分 CSS，内联到 JS 中
    rollupOptions: {
      input: resolve(__dirname, 'src/index.ts'),
      output: {
        format: 'umd',
        exports: 'auto', // 自动检测导出方式
        entryFileNames: `${entryName}.min.js`,
        name: entryName,
        globals: {},
      },
    },
    minify: false,
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    // 确保正确解析 src 目录下的模块
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [cssModuleScriptsPlugin()],
  css: {
    // CSS 作为字符串导出
    modules: {
      generateScopedName: '[name]__[local]',
    },
  },
  esbuild: {
    target: 'es2022',
  },
})
