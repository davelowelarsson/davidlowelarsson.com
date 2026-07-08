# 0005 — Self-hosted media on R2, never gating CI

Date: 2026-07-08
Status: accepted

## Context

Issue #10 asked for video/audio embeds from the owner's own infrastructure
instead of YouTube, so publishing an explanation doesn't hand an audience to
a third party. Two hard constraints shape the design:

- Cloudflare Workers static assets cap at **25 MiB per file** — a media
  binary of any real length cannot live in the repo or `dist/`.
- The site's whole deploy story (`docs/adr/0001`, `0002`) is a fast, fully
  static build with zero servers. Whatever holds media must not become a
  new runtime dependency the build needs to succeed.

## Decision

Media lives in a public Cloudflare R2 bucket (zero egress fees), fronted by
`assets.davidlowelarsson.com` (`MEDIA_ORIGIN` in `src/lib/media.ts`). **R2 is
the source of truth, not the repo.** A fresh checkout with no local media
files must still build and deploy fine — `<Video>`/`<Audio>` just point a
native element's `src` at `MEDIA_ORIGIN`; nothing in the build reads the
files themselves.

Lifecycle tracking is a committed `media-manifest.json` (key → hash → owning
post slugs), kept current by `npm run media:sync` (scans gitignored media
under `src/content/posts`, diffs by content hash, shells out to
`wrangler r2 object put`, hash-skip makes it idempotent). `npm run
media:check` reconciles every `<Video|Audio src>` reference against the
manifest, local disk, and a HEAD request to R2, and is **warn-only — it
always exits 0** and only runs from a local pre-commit hook
(`.githooks/pre-commit`), never from `.github/workflows/ci.yml`. Orphaned
manifest entries (no post references them) are reported, never
auto-deleted — deletion stays a human decision.

## Consequences

- **CI can never fail because media hasn't been uploaded yet.** Publishing a
  post and uploading its media are decoupled operations; forgetting one only
  ever produces a warning, never a blocked deploy.
- A new host dependency (`assets.davidlowelarsson.com`, one more CSP
  `media-src` entry) sits next to the existing `youtube-nocookie.com`
  `frame-src` allowance from issue #37 — both are narrowly scoped, additive
  CSP entries, nothing else weakened.
- `wrangler r2 object put` is real credentialed I/O, so it is isolated behind
  a single `upload()` function in `scripts/media-sync.mjs` that nothing else
  calls — the pure scan/hash/diff/key-derivation logic
  (`src/lib/media-manifest.ts`) is unit-tested without ever touching a real
  bucket, and `existsInR2()` (a read-only HEAD, no credentials) is
  similarly isolated in `scripts/media-check.mjs`.
- No adaptive streaming (HLS) yet — native `<video>`/`<audio>` with a single
  h264/aac (or opus) source is enough for short explanation clips. If
  long-form video ever needs it, Cloudflare Stream is the documented upgrade
  path (same components, different `src`), not built now.
