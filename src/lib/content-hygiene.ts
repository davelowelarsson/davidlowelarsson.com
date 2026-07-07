/**
 * The posts loader only reads <folders>/<slug>/index.md. Any other markdown
 * file under the content tree would be silently skipped — this finds those so
 * a test can fail loudly instead.
 */
export function findOrphanMarkdown(paths: string[]): string[] {
  return paths.filter((path) => {
    if (!path.endsWith('.md')) return false;
    const segments = path.split('/');
    return segments.at(-1) !== 'index.md' || segments.length < 2;
  });
}
