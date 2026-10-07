/**
 * CMS redirects (Impostazioni → Reindirizzamenti) for clicks INSIDE the site.
 *
 * server/middleware/cms-redirects.ts handles addresses typed or opened from
 * outside (the server sees those requests). A click on a link inside the
 * site is handled by the browser alone, so the server never sees it: without
 * this, /en/monitoraggio/gallerie reached from a link showed an empty page.
 * Same list, same rules, refreshed at most once a minute.
 */
type Row = { from: string; to: string; permanent: boolean };

let rows: Map<string, Row> | null = null;
let fetchedAt = 0;

const normalise = (path: string) => (decodeURI(path.split("?")[0] || "/").replace(/\/+$/, "") || "/");

async function load(api: string): Promise<Map<string, Row>> {
    if (rows && Date.now() - fetchedAt < 60_000) return rows;
    try {
        const res = await $fetch<{ redirects: Row[] }>(`${api}/redirects/`, { timeout: 3000 });
        rows = new Map((res?.redirects ?? []).map((row) => [normalise(row.from), row]));
    } catch {
        rows ??= new Map(); // keep the last list; try again in a minute
    }
    fetchedAt = Date.now();
    return rows;
}

export default defineNuxtRouteMiddleware(async (to, from) => {
    // First page load: the server already did this check.
    if (import.meta.server || from.fullPath === to.fullPath) return;

    const api = String(useRuntimeConfig().public.apiBase || "").replace(/\/$/, "");
    const list = await load(api);
    if (!list.size) return;

    const match = /^\/(en|fr)(\/.*)?$/.exec(to.path);
    const prefix = match ? `/${match[1]}` : "";
    const row = list.get(normalise(match ? match[2] || "/" : to.path));
    if (!row) return;

    let target = row.to;
    if (/^https?:\/\//.test(target)) return navigateTo(target, { external: true });
    target = target.replace(/\/+$/, "") || "/";
    if (prefix && !/^\/(en|fr)(\/|$)/.test(target)) target = `${prefix}${target === "/" ? "" : target}`;
    if (target === to.path) return;
    return navigateTo({ path: target, query: to.query, hash: to.hash }, { redirectCode: row.permanent ? 301 : 302 });
});
