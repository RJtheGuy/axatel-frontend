/**
 * Redirects managed in the CMS (Impostazioni → Reindirizzamenti).
 *
 * The pages are served by Nuxt, not by Django, so Wagtail's own redirect
 * handling never sees a visitor. This asks the API for the list (cached for
 * a minute) and answers matching addresses with a redirect, in every
 * language: /en/monitoraggio/gallerie → /en/monitoraggio/tunnel.
 * Only the very first visit waits for the list; after that the last list is
 * used while a fresh one is fetched in the background (update 55, speed).
 * Per language (update 57): when only the Italian page is taken offline, the
 * English and French ones keep their address and only Italian visitors are
 * redirected; the CMS adds the redirect itself (core/auto_redirects.py).
 *
 * Wagtail adds a redirect by itself when the address (slug) of a published
 * page changes, so renaming a page in the CMS never breaks old links. The
 * same list is the place for old WordPress addresses at go-live.
 */
// live_in: languages that still have a published page at that address; those
// visitors see the page, the other languages are redirected (update 57).
type Row = { from: string; to: string; permanent: boolean; live_in?: string[] };

let cache: { at: number; rows: Map<string, Row>; loaded: boolean } = { at: 0, rows: new Map(), loaded: false };
let pending: Promise<void> | null = null;
const TTL = 60_000;
const SKIP = /^\/(api|_nuxt|__nuxt|_ipx|media|static|cms|django-admin|documents)(\/|$)|\.[a-z0-9]{2,5}$/i;
// Files of the old WordPress site (PDF datasheets…): redirected to Documenti.
const OLD_FILES = /^\/wp-content\//i;
// Targets that are files, never prefixed with the language.
const FILE_TARGET = /^\/(documents|media|static)\//;

const normalise = (path: string) => {
    const clean = decodeURI(path.split("?")[0] || "/").replace(/\/+$/, "");
    return clean || "/";
};

async function refresh(api: string): Promise<void> {
    try {
        const res = await $fetch<{ redirects: Row[] }>(`${api}/redirects/?v=2`, { timeout: 3000 });
        const rows = new Map<string, Row>();
        for (const row of res?.redirects ?? []) rows.set(normalise(row.from), row);
        cache = { at: Date.now(), rows, loaded: true };
    } catch {
        cache = { ...cache, at: Date.now() }; // keep the last good list, retry in a minute
    }
}

export default defineEventHandler(async (event) => {
    if (event.method !== "GET" && event.method !== "HEAD") return;
    const url = getRequestURL(event);
    if (SKIP.test(url.pathname) && !OLD_FILES.test(url.pathname)) return;

    if (Date.now() - cache.at > TTL) {
        const api = String(useRuntimeConfig(event).apiInternalBase || "").replace(/\/$/, "");
        pending ??= refresh(api).finally(() => {
            pending = null;
        });
        if (!cache.loaded) await pending;
    }
    if (!cache.rows.size) return;

    const match = /^\/(en|fr)(\/.*)?$/.exec(url.pathname);
    const prefix = match ? `/${match[1]}` : "";
    const path = normalise(match ? match[2] || "/" : url.pathname);
    const row = cache.rows.get(path);
    if (!row) return;
    if (row.live_in?.includes(match ? match[1] : "it")) return;

    let target = row.to;
    if (target.startsWith("/")) {
        target = target.replace(/\/+$/, "") || "/";
        if (prefix && !FILE_TARGET.test(target) && !/^\/(en|fr)(\/|$)/.test(target)) target = `${prefix}${target === "/" ? "" : target}`;
        if (target === url.pathname) return;
    }
    return sendRedirect(event, target + (url.search || ""), row.permanent ? 301 : 302);
});
