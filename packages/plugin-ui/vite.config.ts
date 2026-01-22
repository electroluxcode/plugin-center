import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径打包，支持部署到子路径
  resolve: {
    alias: {
      '@plugin-center/core': path.resolve(__dirname, '../plugin-core/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
