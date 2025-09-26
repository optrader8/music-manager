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
    port: 5173,
    host: 'localhost',
    open: true,
  },
  preview: {
    port: 4173,
  },
  define: {
    'process.env.API_BASE_URL': JSON.stringify('/api'),
  },
});
