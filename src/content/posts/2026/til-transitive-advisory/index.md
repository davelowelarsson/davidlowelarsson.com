---
title: "The dependency version that broke Dependabot"
description: "Five undici advisories, one dependency locked to an exact version, and a Dependabot job that failed every morning instead of opening a PR."
pubDate: 2026-08-13
liveFrom: 2026-08-13
category: til
draft: false
tags: ["npm", "security", "dependabot", "undici", "wrangler"]
---

The Dependabot security job had been red every morning since Monday. Not opening a PR, just erroring out, every run, same failure, same badge on the repo.

Dependabot listed five GitHub advisories against `undici <7.29.0` ([GHSA-8xcm-r25x-g524](https://github.com/advisories/GHSA-8xcm-r25x-g524), [GHSA-4cwx-7wf7-3272](https://github.com/advisories/GHSA-4cwx-7wf7-3272), [GHSA-m8rv-5g2x-5cg5](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5), [GHSA-jr45-8vmc-qm54](https://github.com/advisories/GHSA-jr45-8vmc-qm54), [GHSA-v3r7-h72x-cjcm](https://github.com/advisories/GHSA-v3r7-h72x-cjcm)), and every one came from a dependency I couldn't update directly. The chain was `wrangler → miniflare → undici`, and `miniflare` locks `undici` to exactly `7.28.0`. That left npm trying to move `wrangler` backwards from 4.118.0 to 4.35.0, about 83 minor versions in the wrong direction. Dependabot refused and failed instead of opening a PR.

A dependency, any dependency, failing a full project is not uncommon... but just as annoying every time it happens, especially when the whole point of having automated updates is to keep things current and fresh. And then the workflow that's supposed to do that fails every morning instead.

The vulnerability itself wasn't even the main concern. `wrangler` is a dev dependency and `undici` never ends up in the deployed artifact. The problem was a red job every morning, which is worse than having no security job at all, because you start scrolling past it.

I fixed it with an `overrides` entry for `wrangler` in `package.json`:

```json
{
  "overrides": {
    "wrangler": {
      "undici": "^7.29.0"
    }
  }
}
```

I used `^7.29.0` instead of locking it to exactly `7.29.0`, so npm can still pick up later fixes in version 7. I also added a test that checks the override is still there and that every `undici` version in the lockfile is at least 7.29.0. If an older version comes back, the test should fail before the Dependabot job starts failing every morning again.

**What I would do differently next time:** I would avoid locking a dependency to one exact version unless I really needed to, because the next security update then becomes a problem for everyone depending on it.
