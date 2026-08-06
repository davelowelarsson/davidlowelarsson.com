---
title: "The transitive advisory you can't fix"
description: "Five advisories against undici <7.29.0, all of them sitting behind a transitive exact pin — and a Dependabot job that fails daily instead of opening a PR."
pubDate: 2026-08-13
liveFrom: 2026-08-13
category: til
draft: false
tags: ["npm", "security", "dependabot", "undici", "wrangler"]
---

The Dependabot security job had been red every morning since Monday. Not opening a PR, just erroring out, every run, same failure, same badge on the repo.

Five advisories against `undici <7.29.0`, and every one of them sitting in a dependency I couldn't touch directly. The edge is `wrangler → miniflare → undici`, and `miniflare` pins `undici` to the exact version `7.28.0`, not a range. So npm's only advisory-clearing lockfile walks `wrangler` back from 4.118.0 to 4.35.0, about 83 minor versions in the wrong direction. Dependabot refuses, as it should, and errors out instead of opening a PR.

A dependency, any dependency, failing a full project is not uncommon... but just as annoying every time it happens, especially when the whole point of having automated updates is to keep things current and fresh. And then the workflow that's supposed to do that fails every morning instead.

The vulnerability itself wasn't even the main concern. `wrangler` is a dev dependency and `undici` never ends up in the deployed artifact. The problem was a red job every morning, which is worse than having no security job at all, because you start scrolling past it.

Fix: a root `overrides` entry in `package.json`:

```json
"overrides": { "undici": "^7.29.0" }
```

Caret, not exact. An exact pin one level up repeats the same mistake. The tripwire is a test that asserts every copy of `undici` the lockfile resolves sits at or above the advisory floor, so if the override is ever dropped or a transitive bump reintroduces an old copy, something complains before the security job goes red again.

**Takeaway:** an exact pin is a promise you make to yourself and a constraint you impose on everyone downstream. The version that saved `miniflare` today is the version that breaks the security job tomorrow.
