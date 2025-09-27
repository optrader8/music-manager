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
    allowedHosts: true,
    hmr: {
      host: 'g2.parrot-mine.ts.net',
      port: 32001,
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
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url, '->', options.target + req.url);
          });
        },
      },
    },
  },
  preview: {
    port: 4173,
  },
  define: {
    'process.env.API_BASE_URL': JSON.stringify('/api'),
    'import.meta.env.VITE_API_URL': JSON.stringify('/api/v1'),
  },
});
