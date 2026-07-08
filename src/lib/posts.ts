export const CATEGORIES = ['essay', 'til', 'experiment'] as const;

export type Category = (typeof CATEGORIES)[number];

/** Shown on each category page — the page teaches the term. */
export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  essay:
    'Longer, opinionated pieces on engineering leadership, delivery, and how software gets made.',
  til: 'Today I Learned — quick, unpolished notes captured while building. Written the same day, kept forever.',
  experiment: 'Write-ups from the lab: trying things out, measuring, and keeping honest notes.',
};

export function filterByCategory<T extends { data: { category: Category } }>(
  posts: T[],
  category: Category,
): T[] {
  return posts.filter((post) => post.data.category === category);
}

export interface PostVisibility {
  draft: boolean;
  /**
   * Optional scheduled go-live, as Swedish local wall-clock ("YYYY-MM-DD" or
   * "YYYY-MM-DDTHH:mm"). Absent = live as soon as it is not a draft. See
   * `liveFromHasPassed`.
   */
  liveFrom?: string;
}

export interface Dated {
  data: { pubDate: Date };
}

/**
 * A post is a folder ("bundle") holding index.md or index.mdx plus its assets.
 * The folder name is the slug — parent folders (year, anything else) organize
 * the tree without ever appearing in URLs.
 */
export function postIdFromEntry(entry: string): string {
  const segments = entry.split('/');
  const filename = segments.at(-1);
  if (segments.length < 2 || (filename !== 'index.md' && filename !== 'index.mdx')) {
    throw new Error(
      `Post entry "${entry}" is not a bundle — expected <folders>/<slug>/index.md(x)`,
    );
  }
  return segments.at(-2) as string;
}

/**
 * `now` as an Europe/Stockholm wall-clock string "YYYY-MM-DDTHH:mm". We compare
 * wall-clock to wall-clock so `liveFrom` is always read as Swedish local time —
 * DST included, no offset math — because Intl yields the correct Stockholm
 * components for the actual instant.
 */
function stockholmWallClock(now: Date): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Has a post's scheduled go-live arrived? `liveFrom` is Swedish local:
 * "YYYY-MM-DD" means the start of that day; "YYYY-MM-DDTHH:mm" a specific
 * minute. Undefined = no schedule (publish once not a draft). The lexical
 * comparison is sound because both sides are zero-padded wall-clock strings.
 */
export function liveFromHasPassed(liveFrom: string | undefined, now: Date): boolean {
  if (!liveFrom) return true;
  const target = liveFrom.length === 10 ? `${liveFrom}T00:00` : liveFrom.slice(0, 16);
  return stockholmWallClock(now) >= target;
}

/**
 * Production visibility gate, shared by every surface (pages, RSS, sitemap,
 * llms.txt) so nothing leaks in one place but not another. Previews
 * (`showDrafts`) show everything, including drafts and not-yet-live posts.
 */
export function isVisible(
  data: PostVisibility,
  showDrafts: boolean,
  now: Date = new Date(),
): boolean {
  if (showDrafts) return true;
  return !data.draft && liveFromHasPassed(data.liveFrom, now);
}

/**
 * A non-draft post queued for a future `liveFrom` — it will publish itself
 * later. Surfaced only in previews (in production it is simply hidden), so a
 * scheduled post is distinguishable from a live one at a glance.
 */
export function isScheduled(data: PostVisibility, now: Date = new Date()): boolean {
  return !data.draft && data.liveFrom !== undefined && !liveFromHasPassed(data.liveFrom, now);
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** A `liveFrom` ("2026-07-09" or "2026-07-09T09:00") → "Jul 9" for the badge. */
export function formatScheduleDate(liveFrom: string): string {
  const [, month, day] = liveFrom.slice(0, 10).split('-');
  return `${SHORT_MONTHS[Number(month) - 1] ?? ''} ${Number(day)}`;
}

export function sortByPubDateDesc<T extends Dated>(posts: T[]): T[] {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Year buckets for archive listings — the year divider is what tells a reader
 * that a 2013 study is a 2013 study. Newest year first, newest post first.
 */
export function groupByYear<T extends Dated>(posts: T[]): Array<{ year: number; posts: T[] }> {
  const groups = new Map<number, T[]>();
  for (const post of sortByPubDateDesc(posts)) {
    const year = post.data.pubDate.getFullYear();
    const bucket = groups.get(year);
    if (bucket) {
      bucket.push(post);
    } else {
      groups.set(year, [post]);
    }
  }
  return [...groups.entries()].map(([year, grouped]) => ({ year, posts: grouped }));
}
