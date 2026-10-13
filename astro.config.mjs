import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://ag-literary-publication.pages.dev',
  trailingSlash: 'never',
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
