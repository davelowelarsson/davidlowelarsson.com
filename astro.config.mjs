// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://davidlowelarsson.com',
  integrations: [sitemap()],
  env: {
    schema: {
      SHOW_DRAFTS: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
    },
  },
});
