// Thin CLI wrapper around the pure logic in src/lib/media-manifest.ts
// (issue #10). Reconciles every media key referenced by a `<Video|Audio
// src="...">` in a post against three sources: the committed manifest,
// local files on disk, and R2 (a HEAD request against MEDIA_ORIGIN).
//
// WARN-ONLY, ALWAYS EXITS 0. This is the local pre-commit safety net, not a
// CI gate — R2 is the source of truth, and CI must never fail a build
// because media hasn't been uploaded yet. `existsInR2()` is the one
// function that ever makes a network call — kept separate so unit tests
// (on `categorizeMediaKey` in the pure module) never call it.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { MEDIA_ORIGIN } from '../src/lib/media.ts';
import { categorizeMediaKey, extractMediaRefs, isMediaFile } from '../src/lib/media-manifest.ts';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const POSTS_ROOT = join(REPO_ROOT, 'src/content/posts');
const MANIFEST_PATH = join(REPO_ROOT, 'media-manifest.json');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

/** The one function that ever hits the network — never called by tests. */
async function existsInR2(key) {
  try {
    const response = await fetch(`${MEDIA_ORIGIN}/${key}`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!existsSync(POSTS_ROOT)) {
    console.log('No src/content/posts directory — nothing to check.');
    return;
  }

  const postFiles = walk(POSTS_ROOT).filter(
    (file) => file.endsWith('index.md') || file.endsWith('index.mdx'),
  );

  const referencedKeys = new Set();
  for (const file of postFiles) {
    for (const key of extractMediaRefs(readFileSync(file, 'utf8'))) referencedKeys.add(key);
  }

  if (referencedKeys.size === 0) {
    console.log('media:check — no self-hosted media referenced in any post.');
    return;
  }

  const manifest = readManifest();
  const localFiles = new Set(
    walk(POSTS_ROOT)
      .map((path) => relative(POSTS_ROOT, path))
      .filter(isMediaFile),
  );

  const results = [];
  for (const key of referencedKeys) {
    const inR2 = await existsInR2(key);
    const localFile = localFiles.has(key);
    const status = categorizeMediaKey({ inR2, localFile });
    results.push({ key, status, inManifest: key in manifest });
  }

  const broken = results.filter((r) => r.status === 'broken');
  const syncNeeded = results.filter((r) => r.status === 'sync-needed');
  const ok = results.filter((r) => r.status === 'ok');

  console.log(
    `media:check — ${ok.length} ok, ${syncNeeded.length} pending sync, ${broken.length} broken.`,
  );

  if (syncNeeded.length > 0) {
    console.log('\nLocal-only (not yet in R2) — run `npm run media:sync`:');
    for (const r of syncNeeded) console.log(`  - ${r.key}`);
  }

  if (broken.length > 0) {
    console.log('\n⚠️  BROKEN EMBEDS — referenced by a post but missing from R2 and local disk:');
    for (const r of broken) console.log(`  - ${r.key}`);
  }

  // Warn-only: never fail the commit or the build. Media problems surface
  // here, not as a hard gate — see AGENTS.md and docs/astro-field-guide.md.
  process.exitCode = 0;
}

main();
