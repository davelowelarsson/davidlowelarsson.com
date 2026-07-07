import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321',
    // Never reuse a running server (leftover servers serve stale builds).
    // e2e runs against the DRAFTS-VISIBLE build so content-dependent tests
    // keep working while everything is in draft; the drafts-never-publish
    // guarantee lives in src/lib/production-build.test.ts instead.
    reuseExistingServer: false,
    timeout: 120_000,
    env: { SHOW_DRAFTS: 'true' },
  },
});
