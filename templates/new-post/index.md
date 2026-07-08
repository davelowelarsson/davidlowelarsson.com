---
title: A clear, specific title
description: One sentence that earns the click — shown in lists, feeds, and link previews.
pubDate: 2026-07-07
category: til # til | essay | experiment
draft: true # previews show it, production hides it — flip to false to publish
tags: []
# Optional extras:
# updatedDate: 2026-08-01        # set when you revise a published post
# liveFrom: 2026-08-01           # schedule go-live (Swedish local); or 2026-08-01T09:00 for a time.
#                                # Non-draft posts stay hidden in production until this passes.
#                                # pubDate is the displayed date; liveFrom only controls when it appears.
# cover: ./cover.png             # shown in lists + feeds; png/jpg also becomes the link-preview image
# coverAlt: Describe the cover
---

Open with the point — the first paragraph is what feeds and previews show.

## Use h2 for sections (the page owns h1)

Colocate images next to this file and reference them relatively:

<!-- ![What the image shows](./diagram.svg) -->

Code blocks take a language tag:

```sh
echo "hello"
```

> Blockquotes, **bold**, [links](https://example.com), lists and tables all work — see docs/astro-field-guide.md.

## How to use this template

```sh
cp -r templates/new-post src/content/posts/2026/my-post-slug
# edit src/content/posts/2026/my-post-slug/index.md
# push a branch, open a PR, check the preview URL comment
```
