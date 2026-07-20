/**
 * The posts loader only reads <folders>/<slug>/index.md(x). Any other markdown
 * file under the content tree would be silently skipped — this finds those so
 * a test can fail loudly instead.
 */
export function findOrphanMarkdown(paths: string[]): string[] {
  return paths.filter((path) => {
    if (!/\.mdx?$/.test(path)) return false;
    const segments = path.split('/');
    const filename = segments.at(-1);
    return (filename !== 'index.md' && filename !== 'index.mdx') || segments.length < 2;
  });
}
