// Local-only Playwright config: port 4321 is occupied by an unrelated project's
// dev server on this machine. Identical to the committed playwright.config.ts
// except for the port. Not part of the repo.
import { defineConfig } from '@playwright/test';

const ROOT =
  '/Users/dlo/_versionControl/personalProjects/davidlowelarsson/.claude/worktrees/virtual-puzzling-wolf';

export default defineConfig({
  testDir: `${ROOT}/e2e`,
  use: {
    baseURL: 'http://localhost:4399',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4399',
    cwd: ROOT,
    url: 'http://localhost:4399',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { SHOW_DRAFTS: 'true' },
  },
});
