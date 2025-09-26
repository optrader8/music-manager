import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  tools: {
    rspack: (config) => {
      config.plugins?.push(new TanStackRouterRspack());
      return config;
    },
  },
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
    port: 32001,
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
