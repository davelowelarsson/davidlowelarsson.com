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
- `7.28.0 → 7.29.0` is a patch-level move inside the same major.

## Decision

Pin `undici` forward at the root with an npm `overrides` entry:

```json
"overrides": { "undici": "^7.29.0" }
```

The override is deliberately a **caret range, not an exact pin** — the whole
problem here is what an exact pin does to a downstream consumer, and repeating
that mistake one level up would block the next patch the same way.

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
  is the real cost. The unit suite and all 56 e2e specs pass on `7.29.0`, and a
  broken `wrangler deploy` would fail loudly in CI rather than ship something
  subtly wrong — but the risk is not zero, and it is ours now, not Cloudflare's.
- **This override is temporary and should be deleted, not maintained.** Once
  `miniflare` pins `undici >=7.29.0` itself, the entry and its test become dead
  weight. The tripwire test failing because `undici` is *absent* from the
  lockfile is the signal that that day has come.
- Root `overrides` apply tree-wide, not just under `wrangler`. That is the
  intended reading for a security floor: no copy of `undici` anywhere in the
  tree may sit below it.
