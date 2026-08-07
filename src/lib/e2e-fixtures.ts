/**
 * The rule this module enforces: an e2e spec that is about *rendering* targets
 * a permanent draft fixture, never a published Post.
 *
 * A published Post is writing. Renaming one, retitling one, or moving a
 * paragraph should never break a test about CSS — and it did: a rename on main
 * (`til-astro-7-zod-moved` → `til-astro-ships-its-own-zod`) broke a spec
 * mid-stack for no reason but the pin. The fixtures (`kitchen-sink` and
 * `kitchen-sink-markdown`) exist so those specs have somewhere to point that
 * nothing editorial will ever move.
 *
 * Not every pin is wrong. A test about RSS completeness, sitemap coverage, or a
 * specific Post's metadata is genuinely about published content, and pinning is
 * the only honest thing it can do. Those sites opt out explicitly, per line,
 * with a `content-pinned:` marker carrying a reason — so the exception is a
 * decision someone wrote down rather than a pin nobody noticed.
 */

/**
 * The marker that opts a single line out — on that line, or anywhere in the
 * unbroken run of comment lines directly above it. A reason worth writing is
 * usually longer than a trailing comment, and it should be allowed to be.
 */
export const CONTENT_PINNED_MARKER = 'content-pinned:';

/** A `//`, `/*` or continuation-`*` line — the shapes a justification takes. */
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

/** A `/posts/<slug>/` literal, excluding the `/posts/` index route itself. */
const POST_PATH = /\/posts\/([a-z0-9][a-z0-9-]*)\//g;

/**
 * Whether line `index` carries the marker itself, or is preceded by an unbroken
 * run of comment lines that does. A blank line ends the run — a justification
 * separated from its subject is about something else.
 */
function isExempt(lines: string[], index: number): boolean {
  if (lines[index]?.includes(CONTENT_PINNED_MARKER)) return true;
  for (let above = index - 1; above >= 0; above--) {
    const line = lines[above] as string;
    if (!COMMENT_LINE.test(line)) return false;
    if (line.includes(CONTENT_PINNED_MARKER)) return true;
  }
  return false;
}

export interface PinViolation {
  /** 1-indexed line number within the spec. */
  line: number;
  slug: string;
  text: string;
}

/**
 * Every published-Post slug named by a spec without an explicit opt-out.
 *
 * `fixtureSlugs` are the permanent drafts, which are always allowed. Anything
 * else is a published Post — including a slug that does not currently exist,
 * because a stale pin is exactly the failure this prevents.
 */
export function findUnpinnedPostSlugs(
  source: string,
  fixtureSlugs: Iterable<string>,
): PinViolation[] {
  const fixtures = new Set(fixtureSlugs);
  const lines = source.split('\n');
  const violations: PinViolation[] = [];

  lines.forEach((text, index) => {
    if (isExempt(lines, index)) return;

    for (const match of text.matchAll(POST_PATH)) {
      const slug = match[1] as string;
      if (fixtures.has(slug)) continue;
      violations.push({ line: index + 1, slug, text: text.trim() });
    }
  });

  return violations;
}
