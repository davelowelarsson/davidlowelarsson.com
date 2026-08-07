// The masthead's navigation, as data.
//
// Same shape as `bylines.ts` and `palette.ts`: exported from src/lib so the
// layout and the e2e spec read one list, and adding a destination cannot leave
// a test asserting the old one.

export interface NavLink {
  readonly href: string;
  readonly label: string;
}

/**
 * Two destinations. Categories are NOT here, and that is the decision.
 *
 * The locked prototype showed four — home, posts, essays, experiments — and
 * that was wrong in a way only visible on the built site: `/posts/` already
 * carries a filter rail listing every Category, so `essays` and `experiments`
 * in the masthead were a second route to the same pages, under different
 * labels (plural in one place, singular in the other). A reader on /posts/ saw
 * the same navigation twice and could not tell which was the real one.
 *
 * One navigation per destination. The masthead answers "where am I and how do
 * I get out"; the filter rail answers "narrow this list". Categories belong to
 * the second question, and putting two of the four in the first also implied a
 * hierarchy — essays and experiments above til and project — that the domain
 * model does not have (ADR 0003, ADR 0007).
 */
export const MASTHEAD_NAV = [
  { href: '/', label: 'home' },
  { href: '/posts/', label: 'posts' },
] as const satisfies readonly NavLink[];

/** `/posts` and `/posts/` are the same page; `//` is nobody's route. */
function normalise(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

/**
 * Whether `href` is the page currently being rendered.
 *
 * Exact match only. Prefix matching would light `home` up on every page (`/`
 * prefixes everything), and claiming `aria-current="page"` for a section a
 * reader is merely *inside* tells a screen reader they are somewhere they are
 * not. A post page therefore has nothing marked, which is the honest answer.
 */
export function isCurrentPage(href: string, pathname: string): boolean {
  return normalise(href) === normalise(pathname);
}
