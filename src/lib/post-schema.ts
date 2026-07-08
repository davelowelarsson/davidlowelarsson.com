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
  /**
   * Optional scheduled go-live, as Swedish local wall-clock: "YYYY-MM-DD"
   * (start of that day) or "YYYY-MM-DDTHH:mm". Kept as a string, not a Date,
   * so it is always read as Europe/Stockholm regardless of build-machine
   * timezone. A non-draft post with a future `liveFrom` stays hidden in
   * production until then; `pubDate` is unaffected (it is the displayed date).
   */
  liveFrom: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/,
      'liveFrom must be "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" (Europe/Stockholm)',
    )
    .optional(),
});
