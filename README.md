# davidlowelarsson.com

Personal site of David Lowe Larsson. Astro 7, fully static, deployed to
Cloudflare Workers via GitHub Actions.

## Develop

```sh
npm install
cp .env.example .env   # SHOW_DRAFTS=true → drafts render locally
npm run dev
```

## Quality gates

```sh
npm run verify   # lint + typecheck + unit/component tests + e2e
```

Individually: `npm run lint`, `npm run typecheck`, `npm test`, `npm run e2e`.

## Write a post

Start from the template — it is CI-tested against the frontmatter schema, so
it is always a valid post:

```sh
cp -r templates/new-post src/content/posts/2026/my-post-slug
```

A post is a **bundle**: a folder named after its slug, holding `index.md` plus
everything that belongs to it (images, diagrams). Parent folders organize by
year and never appear in URLs — the folder name IS the slug, and moving a
bundle never breaks a link.

```
src/content/posts/
  2026/
    my-post-slug/
      index.md          → /posts/my-post-slug/
      diagram.svg       → referenced as ![alt](./diagram.svg)
```

Shared images used across posts live in `src/assets/`. Downloadable files
(PDFs etc.) go in `public/files/<slug>/` and are linked absolutely
(`/files/<slug>/paper.pdf`).

Frontmatter in `index.md`:

```md
---
title: Something I learned
pubDate: 2026-07-07
category: til   # essay | til | experiment (default: til)
draft: true     # visible in previews, hidden in production
---
```

Open a PR — the preview deployment shows drafts; merging to `main` deploys
production with drafts hidden.

### Embedding a YouTube video

Posts can be `index.mdx` instead of `index.md` when they need an Astro
component — most commonly `<YouTube />`, a click-to-load facade that loads
nothing from Google until the reader presses play:

```mdx
---
title: Something with a video
pubDate: 2026-07-07
---

import YouTube from '../../../components/YouTube.astro';
import poster from './poster.jpg';

<YouTube id="dQw4w9WgXcQ" title="Descriptive title for screen readers" poster={poster} />
```

`poster` is a local image — either an `import` (optimized by the image
pipeline) or a plain path served as-is. `id` is the YouTube video id; an
optional `start` prop sets a start offset in seconds.

### Embedding video/audio (self-hosted on R2)

Longer explanations can be self-hosted instead of pushed to YouTube: media
lives in a Cloudflare R2 bucket at `assets.davidlowelarsson.com`, never in
the repo (Workers static assets cap at 25 MiB/file — R2 is the source of
truth, and `<Video>`/`<Audio>` work fine even with nothing local at all).

**1. Encode locally.** A short h264/aac mp4 plays everywhere:

```sh
ffmpeg -i source.mov -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k clip.mp4
```

**2. Co-locate it in the post bundle**, same as an image:

```
src/content/posts/2026/my-post-slug/
  index.mdx
  clip.mp4        → gitignored, never committed
  poster.jpg      → committed, goes through the image pipeline
```

**3. Sync to R2** — scans every post bundle, uploads anything new or changed
(by content hash), and updates the committed `media-manifest.json`:

```sh
npm run media:sync
```

**4. Reference it** in an `.mdx` post — `src` is the file's path relative to
`src/content/posts/` (here, `2026/my-post-slug/clip.mp4`):

```mdx
import Video from '../../../components/Video.astro';
import poster from './poster.jpg';

<Video src="2026/my-post-slug/clip.mp4" poster={poster} />
```

`<Audio src="..." />` works the same way for audio-only clips. Both accept
an optional `type` (defaults to `video/mp4` / `audio/mpeg`) and a `<track
kind="captions" .../>` child for captions.

**Never blocks CI.** `npm run media:check` reconciles every embed against
R2, the manifest, and local disk, but only ever warns (exit 0) — it runs
from a local pre-commit hook, not `.github/workflows/ci.yml`. Install the
hook once per clone:

```sh
git config core.hooksPath .githooks
```

A post referencing media that hasn't been synced yet just gets a local
warning; the build and deploy never fail because of it.

## The publish loop

1. Write a post with `draft: true`, push a branch, open a PR
2. CI runs quality gates, then `deploy-preview` uploads a version built with
   `SHOW_DRAFTS=true`
3. Find the preview URL in the PR's **deploy-preview job output** (the
   `Version Preview URL: https://<hash>-davidlowelarsson-com...workers.dev`
   line) — every push gets a fresh URL
4. Review on any device; iterate by pushing to the branch
5. Ready? Flip `draft: false` (or keep drafting), merge — `main` deploys
   production with drafts hidden

## Publishing routine (editorial cadence)

Shipping posts is a standing habit, not an ad-hoc thing. It runs as ~2-week
**cycles**, each a dated milestone plus one `content`-labelled tracker issue
`Content roadmap — cycle N` whose final checkbox opens the next cycle — a loop
that never terminates. Old posts publish as **cousin posts** (an archive piece
released as a companion to a current one). Full ritual, principles, and how to
mine the vault for material: **`docs/publishing-routine.md`**. To act now, open
the current tracker: the open issue labelled `content` titled `Content roadmap`.

## Writing from Obsidian

Drafts start in an Obsidian vault. The site is never coupled to that — the interface is the
frontmatter contract, not the editor: anything that lands in `src/content/posts/` with valid
frontmatter publishes, no matter what wrote it.

**Copy-on-publish.** Write and sketch in the vault, however messy. When a note is close to ready,
copy it — and anything it references — into a post bundle in this repo:

```sh
cp -r ~/vault/publish/my-post src/content/posts/2026/my-post-slug
```

That's the same shape `templates/new-post` produces: a folder named after the slug, `index.md`
plus colocated images, `draft: true` while you finetune it against the preview URL. Open a PR,
review on the preview deployment, flip `draft: false`, merge.

If copy-on-publish ever becomes real friction, the next step (not built yet — only worth it once
this one bites) is a dedicated `publish/` folder in the vault plus the Obsidian Git plugin or a
sync script opening PRs automatically.

**Excalidraw sketches.** Enable **Auto-export SVG** in Obsidian's Excalidraw plugin (same folder,
transparent background). Every save drops a matching `.svg` next to the `.excalidraw` source —
copy that `.svg` into the post bundle along with the markdown and reference it with standard
relative syntax, same as any other image:

```md
![Alt text](./sketch.excalidraw.svg)
```

No client JS, no canvas — Astro hashes and caches it like any static asset. Dark-mode legibility is
handled globally: `img[src*='excalidraw']` gets a `filter: invert(...) hue-rotate(180deg)` in
Base.astro's dark-mode styles, since Excalidraw exports dark strokes on a transparent background
that would otherwise vanish on a dark page.

**Watch out for:**

- **Wiki-links.** Obsidian embeds default to `![[sketch.excalidraw]]` — meaningless to a standard
  markdown renderer. Convert every `![[...]]` to a relative markdown link
  (`![alt](./sketch.excalidraw.svg)`) before copying anything out of the vault.
- **The whole vault is not the publish surface.** Never point a sync script, git plugin, or CI job
  at the entire vault — only at an explicit publish folder. The vault has drafts, private notes,
  and things nobody consented to being blogged about; copy-on-publish is a deliberate one-way step
  precisely so a bug in the sync path can't leak any of that.

## License

- **Code** (everything except `src/content/`): [MIT](./LICENSE) — build on it freely.
- **Content** (`src/content/`, post images, and the writing on davidlowelarsson.com):
  [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) —
  share and adapt with attribution, non-commercial, same license.

## Where things are decided

- `CONTEXT.md` — glossary (Post, Category, Draft, …)
- `docs/prd.md` — v1 scope and working agreement
- `docs/adr/` — architecture decisions (Workers over Pages, static-with-SSR-hatch, category-as-data, self-renewing publishing loop, self-hosted media on R2)
- `docs/astro-field-guide.md` — running ledger of Astro concepts, PR by PR
- `docs/publishing-routine.md` — the editorial cadence: cycles, the self-renewing issue loop, vault mining
- `.github/paths-filter.yml` — which changes count as "affects the built site"; docs-only changes skip build/test/deploy
