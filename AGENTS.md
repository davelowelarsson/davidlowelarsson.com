## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project working agreement

- **TDD, always**: red before green. Pure logic lives in `src/lib/` (Vitest);
  components with behavior get Container API tests (`*.test.ts` next to the
  `.astro` file). `npm run verify` must pass before any commit.
- **Domain language**: `CONTEXT.md` is the glossary (Post, Category, Draft,
  Preview Deployment). Use its terms in code and copy. Decisions with real
  trade-offs go to `docs/adr/`.
- **Field guide**: every PR that introduces an Astro concept appends 3–6 lines
  to `docs/astro-field-guide.md` (concept, why this shape, doc link). This is
  part of the definition of done — David is learning Astro from this ledger.
- **Portability**: all Cloudflare coupling stays in `wrangler.jsonc` + the
  deploy jobs of `.github/workflows/ci.yml`. Never leak host specifics into
  `src/`.
- **Drafts**: `SHOW_DRAFTS` (build-time, `astro:env/server`) is the only draft
  switch. Preview deploys build with it `true`, production with `false`.
- **Post-push checks**: use judgment. Monitor GitHub Actions jobs/workflows when
  the change's risk or scope makes remote CI meaningful, or the task asks for
  it; a routine prose/docs edit does not require monitoring after appropriate
  local validation. Do not wait for, poll, or inspect the Cloudflare Preview
  Deployment unless the task concerns deployment behavior, or David asks for
  the URL or a deployed visual check.
- **Publishing cadence**: posts ship on a self-renewing ~2-week cycle tracked in
  GitHub issues, not ad-hoc. Before proposing what/when to publish, read
  `docs/publishing-routine.md` and the open `content`-labelled `Content roadmap`
  issue. David drives all writing — never draft post content into issues unasked.
- **Voice**: any work on post prose — drafting, editing, reviewing tone — goes
  through the `/draft-post` skill (`.claude/skills/draft-post/`), which loads
  David's voice guide (`VOICE.md`, Tier 1 canon). Never draft or revise post
  content in your own voice.
- **Obfuscation**: published content uses real names (domains, repos,
  namespaces — that's the voice) but obviously-fake values for any identifier
  that is not otherwise publicly discoverable: tunnel/account/zone IDs,
  webhook paths, tokens (e.g. `00000000-dead-beef-...`). The bar: a reader
  who goes searching must not be able to assemble puzzle pieces into an
  exploit. Applies to posts, docs, issues — everything public in this repo.
