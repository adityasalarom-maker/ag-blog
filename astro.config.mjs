import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://ag-literary-publication.pages.dev',
  trailingSlash: 'never',
  build: {
    format: 'directory'
  }
});
