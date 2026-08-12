
export function useCms() {
    const config = useRuntimeConfig()
    const base = import.meta.server
        ? config.apiInternalBase
        : config.public.apiBase

    /** List pages of a given Wagtail page type. */
    async function getPage<T = any>(type: string, params: Record<string, any> = {}) {
        return await $fetch<{ items: T[] }>(`${base}/pages/`, {
            params: { type, fields: '*', ...params },
        })
    }

    /**
     * Fetch a single page by type + slug.
     * Returns null when nothing matches, so callers can 404 cleanly
     * instead of unwrapping undefined.
     */
    async function getPageBySlug<T = any>(type: string, slug: string): Promise<T | null> {
        const res = await $fetch<{ items: T[] }>(`${base}/pages/`, {
            params: { type, fields: '*', slug },
        })
        return res?.items?.[0] ?? null
    }

    /**
     * Resolve a page by its URL path. Uses the custom find_view in
     * core/api.py, which returns page JSON directly instead of Wagtail's
     * default 302 redirect — one round trip instead of two.
     *
     * fields=* is REQUIRED here. find_view calls get_serializer(obj),
     * which emits the DEFAULT field set only — no StreamField bodies, no
     * custom api_fields. Without it `page.body` is undefined and every
     * FlexPage renders as an empty shell with a "Missing required prop"
     * warning from BlockRenderer.
     */
    async function findByPath<T = any>(htmlPath: string) {
        return await $fetch<T>(`${base}/pages/find/`, {
            params: { html_path: htmlPath, fields: '*' },
        })
    }

    /** Active site theme (falls back to DEFAULT_THEME server-side). */
    async function getActiveTheme<T = any>() {
        return await $fetch<T>(`${base}/themes/active/`)
    }

    return { getPage, getPageBySlug, findByPath, getActiveTheme }
}