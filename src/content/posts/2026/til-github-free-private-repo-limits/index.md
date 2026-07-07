---
title: "TIL: Branch protection needs a public repo (or Pro) — and Dependabot has its own secrets"
description: Two GitHub surprises from one afternoon — the features that push a personal site's repo public, and the separate secrets store Dependabot PRs read from.
pubDate: 2026-07-07
category: til
draft: true
tags: ["github", "ci", "dependabot"]
---

> Draft notes from the day it happened — edit before publishing.

Two things I learned setting up this site's repo automation:

**1. Branch protection and auto-merge are gated on private repos.** On the free plan, a private
repo gets a `403: Upgrade to GitHub Pro or make this repository public` when you try to protect
a branch. For a personal website the calculus is easy — the content ships to the public
internet anyway, and every personal site I benchmarked keeps its repo public — so public it
went, and both features lit up immediately. Auto-merge plus a required CI check is what lets
Dependabot's minor/patch updates merge themselves safely.

**2. Dependabot doesn't read your Actions secrets.** Workflows triggered by Dependabot PRs get
a *separate* secrets store (Settings → Secrets and variables → **Dependabot**). Until you copy
the relevant secrets there, any deploy/preview step in those runs sees empty values. Our
preview deploys skip gracefully in that case — but it took a moment to understand why a
perfectly green workflow produced no preview URL.
