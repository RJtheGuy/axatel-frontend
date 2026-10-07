/**
 * "New posts" counter for the Blog link in the menu.
 *
 * A post counts as new when its publication date (the "Data pubblicazione"
 * field in the CMS) is in the last 30 days and the visitor hasn't seen it
 * yet. Opening /news marks every listed post as seen; opening a post marks
 * that post as seen. What has been seen is remembered by slug. The state lives in the visitor's browser (localStorage), so
 * there are no accounts or cookies involved.
 *
 * Runs only in the browser, after the page has loaded: search engines and
 * the server-rendered page never see a count, so it can't cause flicker or
 * mismatches, and a failure just means no badge.
 */
type BlogItem = { slug: string; date: string };

const STORAGE_KEY = "ax-blog-seen";
const WINDOW_DAYS = 30;
const MAX_REMEMBERED = 100;

// One request per visit, shared by the menu and the blog pages (browser only).
let loading: Promise<void> | null = null;

function readSeen(): string[] {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (Array.isArray(raw)) return raw.filter((s) => typeof s === "string");
    } catch {
        /* private mode or corrupted value: start fresh */
    }
    return [];
}

function writeSeen(value: string[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value.slice(-MAX_REMEMBERED)));
    } catch {
        /* storage unavailable: the badge simply comes back next visit */
    }
}

export function useBlogUpdates() {
    const posts = useState<BlogItem[]>("ax-blog-posts", () => []);
    const seen = useState<string[]>("ax-blog-seen", () => []);

    const count = computed(() => {
        const d = new Date();
        d.setDate(d.getDate() - WINDOW_DAYS);
        const since = d.toISOString().slice(0, 10);
        return posts.value.filter((p) => p.date >= since && !seen.value.includes(p.slug)).length;
    });

    /** Fetch the latest posts once per visit (browser only). */
    function load(): Promise<void> {
        if (import.meta.server) return Promise.resolve();
        if (!loading) {
            seen.value = readSeen();
            const { getPage } = useCms();
            loading = getPage<any>("blog.BlogPost", { order: "-date", limit: 20 })
                .then((res) => {
                    posts.value = ((res?.items ?? []) as any[])
                        .map((p) => ({ slug: String(p?.meta?.slug ?? ""), date: String(p?.date ?? "").slice(0, 10) }))
                        .filter((p) => p.slug && p.date);
                })
                .catch(() => {
                    posts.value = [];
                });
        }
        return loading;
    }

    function remember(slugs: string[]): void {
        const fresh = slugs.filter((s) => s && !seen.value.includes(s));
        if (!fresh.length) return;
        seen.value = [...seen.value, ...fresh].slice(-MAX_REMEMBERED);
        writeSeen(seen.value);
    }

    /** Visitor opened the blog list: every post published so far is seen. */
    async function markAllSeen(): Promise<void> {
        if (import.meta.server) return;
        await load();
        remember(posts.value.map((p) => p.slug));
    }

    /** Visitor opened one post: that post is no longer new. */
    async function markRead(slug: string): Promise<void> {
        if (import.meta.server || !slug) return;
        await load();
        remember([slug]);
    }

    return { count, load, markAllSeen, markRead };
}

/**
 * True for the news list address in any language: /news, /en/news, /fr/news.
 * The old /blog address still counts (a CMS menu not yet renamed), since it
 * redirects to /news.
 */
export function isBlogHref(href?: string | null): boolean {
    return /^(\/(en|fr))?\/(news|blog)\/?$/.test(href || "");
}
