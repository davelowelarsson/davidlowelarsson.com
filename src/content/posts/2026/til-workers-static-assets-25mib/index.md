---
title: "Workers static assets cap files at 25 MiB"
description: "Cloudflare's static-assets hosting refuses any single file over 25 MiB, which settled where the video on this site was going to live before I had uploaded any."
pubDate: 2026-07-07
category: til
draft: true
tags: ["cloudflare", "workers", "video", "r2"]
---

I've been pulling old work back out of the archive while rebuilding this site, and some of it is
video... showreels, the Dragon animations, things that were never text to begin with. I'd also
like to record a loom now and then and just show how something works instead of describing it. So
while planning I went looking for where video would live, assuming the answer was "put it in the
repo and let the build ship it".

It isn't. Workers static assets cap a single file at 25 MiB, on free and paid alike (the plans
differ on file count, 20,000 against 100,000, not on size). I never hit the cap myself, it turned
up while planning, which is a much nicer way to learn a limit 😅

So media lives in an R2 bucket behind `assets.davidlowelarsson.com`, and R2 is the source of truth
rather than the repo, so a fresh checkout with no media files still builds fine. The repo keeps a
manifest of what should exist in the bucket, keyed by the file's path under the posts folder:

```json
{
  "2026/my-post/clip.mp4": { "hash": "…", "posts": ["my-post"] }
}
```

`npm run media:sync` scans, hashes and uploads whatever is missing, and `npm run media:check`
reconciles every `<Video>` and `<Audio>` reference against the manifest, the disk and a HEAD
request to the bucket. It's warn-only, always exits 0, and runs from a pre-commit hook rather than
in CI. That part was deliberate. I don't want a build failing because I renamed something, but I
do want to be acutely aware of a broken video while there's still time to fix it.

And no YouTube. Someone came here to read something, they shouldn't get served ads for it 🙃

**Takeaway:** Workers static assets stop at 25 MiB per file, so anything longer than a gif belongs
in R2 with its zero egress fees, and the repo only remembers what should be in there.

## Links

- [Workers platform limits, static assets](https://developers.cloudflare.com/workers/platform/limits/#static-assets)
