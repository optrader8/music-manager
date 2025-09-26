import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 32001,
    host: '0.0.0.0',
    open: false,
    allowedHosts: ['g2', 'localhost', '127.0.0.1'],
    hmr: {
      port: 32001,
      host: '0.0.0.0',
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': {
        target: 'http://music-manager-backend:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
  },
  define: {
    'process.env.API_BASE_URL': JSON.stringify('/api'),
  },
});
