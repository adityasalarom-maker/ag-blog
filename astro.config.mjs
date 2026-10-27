import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://ag-literary-publication.pages.dev',
  trailingSlash: 'never',
  server: {
    host: true,
    port: 4321
  },
  vite: {
    server: {
      allowedHosts: true
    }
  },
  security: {
    checkOrigin: false
  },
  adapter: node({
    mode: 'standalone'
  }),
  build: {
    format: 'directory'
  }
});
