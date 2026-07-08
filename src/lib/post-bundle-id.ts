/**
 * A post is a folder ("bundle") holding index.md/index.mdx plus its assets.
 * The folder name is the slug — parent folders (year, anything else)
 * organize the tree without ever appearing in URLs.
 *
 * This is a sibling of `postIdFromEntry` in `src/lib/posts.ts`, not a
 * replacement — that function only accepts `index.md` and is owned by a
 * parallel in-flight PR (scheduled publishing), so MDX bundle-id support
 * lives here instead of widening it in place.
 */
export function postIdFromBundleEntry(entry: string): string {
  const segments = entry.split('/');
  const filename = segments.at(-1);
  if (segments.length < 2 || (filename !== 'index.md' && filename !== 'index.mdx')) {
    throw new Error(
      `Post entry "${entry}" is not a bundle — expected <folders>/<slug>/index.md(x)`,
    );
  }
  return segments.at(-2) as string;
}
