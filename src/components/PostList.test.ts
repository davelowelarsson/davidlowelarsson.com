import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostList from './PostList.astro';

const entry = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  data: {
    title: `Title of ${id}`,
    pubDate: new Date('2026-07-01'),
    category: 'til',
    draft: false,
    ...overrides,
  },
});

describe('PostList', () => {
  it('renders a link to each post', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PostList, {
      props: { posts: [entry('first-note'), entry('second-note')] },
    });

    expect(html).toContain('Title of first-note');
    expect(html).toContain('href="/posts/first-note/"');
    expect(html).toContain('Title of second-note');
    expect(html).toContain('href="/posts/second-note/"');
  });

  it('shows the category of each post', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PostList, {
      props: { posts: [entry('a-note', { category: 'essay' })] },
    });

    expect(html).toContain('essay');
  });

  it('marks drafts so previews are unmistakable', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PostList, {
      props: { posts: [entry('wip', { draft: true })] },
    });

    expect(html).toContain('draft');
  });

  it('does not mark published posts as drafts', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(PostList, {
      props: { posts: [entry('done', { draft: false })] },
    });

    expect(html).not.toContain('draft');
  });
});
