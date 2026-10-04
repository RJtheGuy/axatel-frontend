/**
 * Redirects managed in the CMS (Impostazioni → Reindirizzamenti).
 *
 * The pages are served by Nuxt, not by Django, so Wagtail's own redirect
 * handling never sees a visitor. This asks the API for the list (cached for
 * a minute) and answers matching addresses with a redirect, in every
 * language: /en/monitoraggio/gallerie → /en/monitoraggio/tunnel.
 *
 * Wagtail adds a redirect by itself when the address (slug) of a published
 * page changes, so renaming a page in the CMS never breaks old links. The
 * same list is the place for old WordPress addresses at go-live.
 */
type Row = { from: string; to: string; permanent: boolean };

let cache: { at: number; rows: Map<string, Row> } = { at: 0, rows: new Map() };
let pending: Promise<void> | null = null;
const TTL = 60_000;
const SKIP = /^\/(api|_nuxt|__nuxt|_ipx|media|static|cms|django-admin|documents)(\/|$)|\.[a-z0-9]{2,5}$/i;

const normalise = (path: string) => {
    const clean = decodeURI(path.split("?")[0] || "/").replace(/\/+$/, "");
    return clean || "/";
};

async function refresh(api: string): Promise<void> {
    try {
        const res = await $fetch<{ redirects: Row[] }>(`${api}/redirects/`, { timeout: 3000 });
        const rows = new Map<string, Row>();
        for (const row of res?.redirects ?? []) rows.set(normalise(row.from), row);
        cache = { at: Date.now(), rows };
    } catch {
        cache = { ...cache, at: Date.now() }; // keep the last good list, retry in a minute
    }
}

export default defineEventHandler(async (event) => {
    if (event.method !== "GET" && event.method !== "HEAD") return;
    const url = getRequestURL(event);
    if (SKIP.test(url.pathname)) return;

    if (Date.now() - cache.at > TTL) {
        const api = String(useRuntimeConfig(event).apiInternalBase || "").replace(/\/$/, "");
        pending ??= refresh(api).finally(() => {
            pending = null;
        });
        await pending;
    }
    if (!cache.rows.size) return;

    const match = /^\/(en|fr)(\/.*)?$/.exec(url.pathname);
    const prefix = match ? `/${match[1]}` : "";
    const path = normalise(match ? match[2] || "/" : url.pathname);
    const row = cache.rows.get(path);
    if (!row) return;

    let target = row.to;
    if (target.startsWith("/")) {
        target = target.replace(/\/+$/, "") || "/";
        if (prefix && !/^\/(en|fr)(\/|$)/.test(target)) target = `${prefix}${target === "/" ? "" : target}`;
        if (target === url.pathname) return;
    }
    return sendRedirect(event, target + (url.search || ""), row.permanent ? 301 : 302);
});
