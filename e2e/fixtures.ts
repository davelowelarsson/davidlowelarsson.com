/**
 * The permanent draft fixtures every render-focused spec targets.
 *
 * They are `draft: true` forever, so `SHOW_DRAFTS=true` (what this suite and a
 * Preview Deployment build with) makes them present, and the production build
 * makes them absent — a guarantee `src/lib/production-build.test.ts` owns and
 * tests. Nothing editorial can move them, which is the whole point: a published
 * Post is writing, and renaming one should never break a test about CSS.
 *
 * The rule is enforced, not merely documented: `src/lib/e2e-fixtures.test.ts`
 * scans every spec in this directory and fails on a published slug that has no
 * `content-pinned:` reason beside it.
 */

/** The component tier: `.mdx`, every media component, a diagram, a breakout figure. */
export const KITCHEN_SINK = '/posts/kitchen-sink/';

/** The Markdown tier: `.md`, plain images that get framing but never a figure. */
export const KITCHEN_SINK_MARKDOWN = '/posts/kitchen-sink-markdown/';
