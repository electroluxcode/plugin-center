import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@plugin-center/core': path.resolve(__dirname, '../plugin-core/src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
