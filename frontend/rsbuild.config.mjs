import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  output: {
    assetPrefix: '/',
  },
  source: {
    entry: {
      index: './src/index.tsx',
    },
    define: {
      'process.env.API_BASE_URL': JSON.stringify('/api'),
    },
  },
  dev: {
    hmr: true,
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  html: {
    template: './public/index.html',
  },
});
