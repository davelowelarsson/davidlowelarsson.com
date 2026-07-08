import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { postIdFromBundleEntry } from './lib/post-bundle-id';
import { postFrontmatterSchema } from './lib/post-schema';

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => postIdFromBundleEntry(entry),
  }),
  schema: ({ image }) =>
    postFrontmatterSchema.extend({
      cover: image().optional(),
      coverAlt: z.string().optional(),
    }),
});

export const collections = { posts };
