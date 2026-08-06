# 0008 — Hold a transitive `undici` forward with an npm override

Date: 2026-08-06
Status: accepted

## Context

Dependabot's **security** update job started failing on every run from
2026-08-04, erroring out instead of opening a PR:

> A patched version exists for undici, but the available update path would
> downgrade wrangler from 4.118.0 to 4.35.0.

Five advisories (`GHSA-8xcm-r25x-g524`, `GHSA-4cwx-7wf7-3272`,
`GHSA-m8rv-5g2x-5cg5`, `GHSA-jr45-8vmc-qm54`, `GHSA-v3r7-h72x-cjcm`) apply to
`undici >=7.0.0 <7.29.0`. The dependency edge is:

```
wrangler → miniflare → undici
```

`miniflare` does not declare a *range* for `undici`; it pins the **exact**
version `7.28.0`. So npm cannot satisfy the advisory by resolving forward to
`7.29.0` — the only lockfile it can produce that clears the advisory is one
that walks `wrangler` back ~83 minor versions to 4.35.0. Dependabot correctly
refuses to do that, and the job fails rather than no-ops. A failing security
job every day is worse than useless: it trains you to ignore the one signal
that should never be ignored.

Two facts bound the actual risk:

- `wrangler` is a **devDependency**. The site is a fully static build
  (`adr/0002`); `undici` is not in the deployed artifact, and it is not in the
  `astro preview` path the e2e suite exercises. Its blast radius is local
  tooling and the deploy step.
- `7.28.0 → 7.29.0` is a **minor** move inside the same major — not a patch.
  We are overriding a dependency its author pinned exactly, so the honest
  framing is a forced minor upgrade, not a trivial one.

## Decision

Pin `undici` forward with an npm `overrides` entry **scoped to the `wrangler`
subtree**, not applied tree-wide:

```json
"overrides": { "wrangler": { "undici": "^7.29.0" } }
```

The override is deliberately a **caret range, not an exact pin** — the whole
problem here is what an exact pin does to a downstream consumer, and repeating
that mistake one level up would block the next patch the same way.

It is scoped rather than tree-wide because `wrangler → miniflare` is the only
edge that is actually stuck. A root-level `"undici"` override would also work
today (nothing else in the tree depends on undici), but it would silently
impose a 7.x floor on every *future* dependency too — including one that
legitimately needed undici 6. That is a standing constraint accepted in
exchange for nothing: any other vulnerable undici would be fixable by the
normal Dependabot path, because no one else pins it exactly. Fix the broken
edge; leave the working mechanism alone.

`src/lib/dependency-overrides.test.ts` is the tripwire. It asserts the override
still exists in `package.json` and — the assertion that actually matters — that
**every** `undici` the lockfile resolves sits at or above the advisory floor.
The regression this guards against is silent: someone drops the override, or a
transitive bump reintroduces an old copy under a different tree path, and
nothing complains until the security job goes red again.

Rejected alternatives:

- **`ignore` the advisory in `dependabot.yml`.** Makes the failure disappear
  without making the vulnerability disappear, and `ignore` has no expiry — it
  would still be silencing `undici` long after wrangler fixed its pin.
- **Downgrade wrangler to 4.35.0.** Trades five advisories in a dev-only path
  for a year of missing Workers platform fixes.
- **Wait for Cloudflare.** Correct eventually, unbounded in the meantime, and
  leaves the job red the whole time.

## Consequences

- `npm audit` reports **0 vulnerabilities**, so the security job has nothing to
  open a PR about and stops failing.
- We are running `miniflare` against an `undici` its authors did not pin. This
  is the real cost, and it is worth being exact about what our tests do and do
  not cover:
  - **Covered.** `deploy-preview` in `ci.yml` runs `wrangler versions upload`
    against the live Cloudflare API on every PR, so wrangler's own HTTP path —
    the code that actually uses `undici` — is exercised end to end. It passed.
  - **Not covered.** `miniflare`'s local Workers emulation. Nothing in this
    repo invokes it: the dev server is `astro dev` and e2e runs against
    `astro preview`, neither of which touches miniflare or `workerd`. So the
    unit and e2e suites passing says nothing about that path. It is untested
    here because it is unused here — not because we checked it.
  The risk is not zero, and it is ours now, not Cloudflare's.
- **This override is temporary and should be deleted, not maintained.** Once
  `miniflare` pins `undici >=7.29.0` itself, the entry and its test become dead
  weight. The tripwire test failing because `undici` is *absent* from the
  lockfile is the signal that that day has come.
- The tripwire's comparison is real semver, not a `split('-')` approximation.
  The naive version reads `7.29.0-alpha.1` as equal to `7.29.0`, so a
  prerelease that *precedes* the patched release would pass the floor — and
  this tree already resolves `undici` under an alpha-tagged `miniflare`, so
  that is a live case, not a hypothetical. `src/lib/version-floor.ts` handles
  prerelease ordering and build metadata, with the failing cases pinned in its
  own tests.
