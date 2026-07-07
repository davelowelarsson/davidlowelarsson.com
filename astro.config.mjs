// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://davidlowelarsson.com',
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
