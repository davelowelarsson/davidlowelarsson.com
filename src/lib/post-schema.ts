import { z } from 'astro/zod';
import { CATEGORIES } from './posts';

/**
 * A real Swedish-local wall-clock: "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm", where the
 * calendar date actually exists and the time is in range. The format regex
 * alone would wave through impossible values (2026-13-40, T99:99), which then
 * sort lexically and never (or wrongly) go live — so validate semantics too.
 * The Date here is used ONLY to check the date is real; it carries no timezone
 * meaning (that lives in the wall-clock comparison in posts.ts).
 */
export function isRealWallClock(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
  if (!match) return false;
  const [, y, mo, d, hh = '00', mm = '00'] = match;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  if (Number(hh) > 23 || Number(mm) > 59) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

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
   * Optional scheduled go-live, read as Swedish local wall-clock: a bare date
   * ("YYYY-MM-DD", start of that day) or "YYYY-MM-DDTHH:mm". A non-draft post
   * with a future `liveFrom` stays hidden in production until then; `pubDate`
   * is unaffected (it is the displayed date).
   *
   * YAML parses an unquoted `2026-07-09` as a Date, so we accept a Date too and
   * normalize it back to its calendar "YYYY-MM-DD" (via UTC components — a YAML
   * bare date is UTC midnight). Quote it (`"2026-07-09T09:00"`) when you need a
   * time. It is compared as a string, never as an instant, to stay DST-safe and
   * independent of the build machine's timezone.
   */
  liveFrom: z
    .union([z.string(), z.date()])
    .transform((value) =>
      value instanceof Date
        ? `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`
        : value,
    )
    .refine(
      isRealWallClock,
      'liveFrom must be a real "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" (Europe/Stockholm)',
    )
    .optional(),
});
