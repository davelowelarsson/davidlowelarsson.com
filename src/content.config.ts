import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { postFrontmatterSchema } from './lib/post-schema';
import { postIdFromEntry } from './lib/posts';

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.md',
    base: './src/content/posts',
    generateId: ({ entry }) => postIdFromEntry(entry),
  }),
  schema: ({ image }) =>
    postFrontmatterSchema.extend({
      cover: image().optional(),
      coverAlt: z.string().optional(),
    }),
});

export const collections = { posts };
