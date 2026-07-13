---
title: "Biome lint presets"
description: "Biome's recommended preset is opinionated enough that most projects only need a small overrides block, not a rule-by-rule config."
pubDate: 2026-05-22
category: til
draft: true
tags: ["biome", "linting", "tooling"]
---

Swapped this site's ESLint + Prettier combo for Biome a while back and finally read past the
"it's fast" pitch to how the `recommended` preset is actually structured.

![Abstract composition of stacked translucent bars suggesting a rule preset](./til-biome-lint-presets.svg)

## Presets, not rule lists

`biome.json` doesn't ask you to enumerate rules. It asks you to pick a preset:

```json
{
  "linter": {
    "enabled": true,
    "rules": { "preset": "recommended" }
  }
}
```

`recommended` bundles correctness, suspicious-pattern, and a11y checks that would otherwise be a
few dozen lines in an ESLint config plus three plugins. Turning a specific rule off is a small
`overrides` block scoped to a glob, not a project-wide toggle:

```json
{
  "overrides": [
    {
      "includes": ["**/*.astro"],
      "linter": {
        "rules": { "correctness": { "noUnusedVariables": "off" } }
      }
    }
  ]
}
```

## What surprised me

- The a11y rules fire on raw SVGs too — missing `<title>` elements got flagged, which is a genuinely
  useful nudge for anything colocated with markdown content.
- `biome check` runs formatting and linting in one pass, so CI only needs one command instead of
  two separate tools with two separate configs to keep in sync.

**Takeaway:** start from `recommended`, override narrowly by file glob, and don't try to
hand-roll an equivalent rule set — the preset already encodes most of what a leaner ESLint config
would need three plugins to reach.
