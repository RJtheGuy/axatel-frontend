/**
 * Search engines: the go-live switch (CMS → Impostazioni → Motori di ricerca).
 *
 * Until it is switched on, every response carries "X-Robots-Tag: noindex"
 * and robots.txt blocks everything (server/routes/robots.txt.ts), so this
 * site never competes with the live axatel.it. On a bare IP address
 * (80.211.135.192) or localhost it is never indexable, whatever the CMS says.
 *
 * The switch is read from GET /api/v2/indexing/ and cached for a minute.
 * Speed and safety (update 55): once the switch has been read, visitors never
 * wait for the API again: the last answer is used while a fresh one is
 * fetched in the background, and if the API is briefly down (a restart during
 * a release) the last answer is kept, so Google never sees a "noindex" for a
 * minute by accident. Only when the switch has never been read yet does a
 * failure mean "noindex" (the safe side); that is retried after 10 seconds.
 */
let cache = { at: 0, allow: false, known: false };
let pending: Promise<void> | null = null;
const TTL = 60_000;
const RETRY = 10_000;

async function refresh(api: string): Promise<void> {
    try {
        const res = await $fetch<{ allowIndexing?: boolean }>(`${api}/indexing/`, { timeout: 3000 });
        cache = { at: Date.now(), allow: Boolean(res?.allowIndexing), known: true };
    } catch {
        // Keep the last answer; with none yet, try again soon.
        cache = { ...cache, at: cache.known ? Date.now() : Date.now() - TTL + RETRY };
    }
}

export function isPrivateHost(host: string): boolean {
    const name = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "").toLowerCase();
    return !name || name === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(name) || name.includes(":");
}

export default defineEventHandler(async (event) => {
    const host = getRequestHost(event, { xForwardedHost: true });
    let allow = false;
    if (!isPrivateHost(host)) {
        if (Date.now() - cache.at > TTL) {
            const api = String(useRuntimeConfig(event).apiInternalBase || "").replace(/\/$/, "");
            pending ??= refresh(api).finally(() => {
                pending = null;
            });
            if (!cache.known) await pending;
        }
        allow = cache.allow;
    }
    event.context.allowIndexing = allow;
    if (!allow) setHeader(event, "X-Robots-Tag", "noindex, nofollow");
});
