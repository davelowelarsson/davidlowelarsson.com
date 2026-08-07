# 0010 — Theme control: `light-dark()` + `color-scheme`, and auto as the absence of an attribute

Date: 2026-08-07
Status: accepted

## Context

Readers can now choose light, dark, or follow-the-system. The obvious
implementations are all heavier than what this site needs:

- **Two full sets of custom properties**, swapped by a class. Doubles the
  palette and gives a colour two places to be defined — the exact thing
  `src/lib/palette.ts` exists to prevent.
- **A media-query-only site** with no control at all. Cheapest, but a reader
  whose OS is set one way and whose eyes want the other has no recourse.
- **A boolean toggle.** Loses the third state, and "follow the system" is the
  one most readers should stay on.

The mechanism was already half-built before this ticket: every token is a
`light-dark()` pair, and `:root` carries `color-scheme: light dark`.

## Decision

**Three states, and auto is the absence of `data-theme`.**

```css
:root                     { color-scheme: light dark; }
:root[data-theme='light'] { color-scheme: light; }
:root[data-theme='dark']  { color-scheme: dark; }
```

Because every token is a `light-dark()` pair, `color-scheme` is the only lever:
one property on one element flips the entire page, and no token is duplicated.

Auto being the *absence* of the attribute is what makes the default free. There
is no `[data-theme='system']` rule to write, because with nothing forcing a
scheme, `:root`'s `light dark` applies and the OS decides. An unrecognised
stored value — stale, hand-edited, a theme that no longer exists — takes the
attribute off rather than leaving a broken page.

**The control is a labelled group, not an icon.** `role="group"` with an
accessible name, three buttons, `aria-pressed` reporting which is active. A
reader can see which of the three is in force, which a two-state icon toggle
cannot express.

**The pre-paint script stays inline, classic, and above the stylesheet.**

An inline parser-blocking script at the top of `<head>` reads the stored
preference and sets the attribute before the first paint. Three refactors break
this silently — bundling it, making it a module (both make it deferred, so it
runs *after* paint), and moving it below the stylesheet. None of them error.
The only symptom is one frame of the wrong ground on a slow load, which nobody
reproduces on a fast laptop.

So the guarantee is asserted **structurally**, not behaviourally: the test
checks the script has no `src`, is not `type="module"`, carries no
`defer`/`async`, sits in `<head>`, and precedes the stylesheet. Same contract
and same guard as the byline rotation.

## Consequences

- **Every `prefers-color-scheme` query needs a `[data-theme]` companion.** The
  media query asks the *operating system* and cannot see a forced theme. A
  reader on a light OS who picks dark gets the dark page from `color-scheme`
  while every media-query rule stays silent. The live instance is the
  Excalidraw invert: dark page, un-inverted sketch, dark strokes on a dark
  ground, invisible. The pattern is a narrowed query plus a companion:

  ```css
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) img[src*='excalidraw'] { filter: …; }
  }
  :root[data-theme='dark'] img[src*='excalidraw'] { filter: …; }
  ```

  `src/lib/theme.test.ts` parses the sheet and fails if any
  `prefers-color-scheme` selector lacks either half, because this failure is
  invisible except on the one OS/choice combination nobody checks by hand.

- **With JavaScript off the page is correct**, just not switchable: no
  attribute is ever set, so the OS preference applies. Today's behaviour,
  unchanged.

- **`localStorage` may throw** (private mode, embedded webviews). Both scripts
  swallow it and fall back to following the OS; a reader in that state can
  still switch for the current page.

- The script is duplicated logic in the sense that it cannot import from
  `src/lib/theme.ts` — inlining it is the whole point. `define:vars` passes the
  storage key and attribute name in, so the *names* are still defined once even
  though the ten lines of DOM code are not.

- A second inline script sits next to the control in `<body>` to sync
  `aria-pressed` and wire the clicks. It is not the pre-paint step; splitting
  them is what lets the pre-paint one stay in `<head>` where it must be.
