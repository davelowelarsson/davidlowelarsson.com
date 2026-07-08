// Thin CLI wrapper around the pure logic in src/lib/media-manifest.ts
// (issue #10). Scans src/content/posts for gitignored media files, diffs
// them against the committed media-manifest.json, uploads new/changed
// files to R2, and updates the manifest.
//
// This NEVER runs in CI — R2 is the source of truth, and a fresh checkout
// with no local media must still build + deploy fine. Only a human running
// `npm run media:sync` locally (with R2 credentials) uploads anything.
//
// `upload()` is the one function that ever shells out to wrangler — kept
// separate from every other function here so unit tests (which live on the
// pure module, not on this wrapper) never execute it.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  diffManifest,
  extractMediaRefs,
  findOrphans,
  mergeManifest,
  scanMediaFiles,
} from '../src/lib/media-manifest.ts';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const POSTS_ROOT = join(REPO_ROOT, 'src/content/posts');
const MANIFEST_PATH = join(REPO_ROOT, 'media-manifest.json');
const R2_BUCKET = 'davidlowelarsson';

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

function writeManifest(manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

/** The one function that ever touches R2 — never called by tests. */
function upload(key, filePath) {
  execFileSync(
    'wrangler',
    ['r2', 'object', 'put', `${R2_BUCKET}/${key}`, '--file', filePath, '--remote'],
    { stdio: 'inherit' },
  );
}

function allReferencedKeys() {
  const refs = new Set();
  for (const file of walk(POSTS_ROOT)) {
    if (!file.endsWith('index.md') && !file.endsWith('index.mdx')) continue;
    for (const key of extractMediaRefs(readFileSync(file, 'utf8'))) refs.add(key);
  }
  return refs;
}

function main() {
  if (!existsSync(POSTS_ROOT)) {
    console.log('No src/content/posts directory — nothing to sync.');
    return;
  }

  const files = walk(POSTS_ROOT).map((path) => ({
    path: relative(POSTS_ROOT, path),
    content: readFileSync(path),
  }));

  const scanned = scanMediaFiles(files);
  const manifest = readManifest();
  const { toUpload, unchanged } = diffManifest(manifest, scanned);

  for (const file of toUpload) {
    console.log(`Uploading ${file.key}...`);
    upload(file.key, join(POSTS_ROOT, file.key));
  }

  // Re-merge every scanned file (not just uploads) so post-slug tracking
  // stays accurate even for hash-unchanged files — idempotent by
  // construction, since mergeManifest writes the same hash back.
  const nextManifest = mergeManifest(manifest, scanned);
  writeManifest(nextManifest);

  const orphans = findOrphans(nextManifest, allReferencedKeys());

  console.log(`\nmedia:sync — ${toUpload.length} uploaded, ${unchanged.length} unchanged.`);
  if (orphans.length > 0) {
    console.log(
      '\nOrphaned manifest entries (no post references them — review before deleting from R2):',
    );
    for (const key of orphans) console.log(`  - ${key}`);
  }
}

main();
