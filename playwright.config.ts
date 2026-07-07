import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    // Never reuse a running server: e2e asserts production behavior and must
    // build fresh with drafts off, regardless of local .env or leftover servers.
    reuseExistingServer: false,
    timeout: 120_000,
    env: { SHOW_DRAFTS: 'false' },
  },
});
