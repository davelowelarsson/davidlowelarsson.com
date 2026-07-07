import { z } from 'astro/zod';
import { CATEGORIES } from './posts';

/**
 * The frontmatter contract for a post, shared by the content collection
 * (which extends it with image-processing fields) and the template test —
 * so templates/new-post is provably a valid post at all times.
 */
export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  category: z.enum(CATEGORIES).default('til'),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});
