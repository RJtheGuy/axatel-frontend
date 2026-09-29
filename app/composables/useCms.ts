/**
 * CMS access, language-aware.
 *
 * Every call asks the API for the visitor's current language
 * (?locale=it|en|fr). When a page has no translation yet, the Italian
 * page is returned instead, marked with `__fallback: true` so the page
 * can show a "not translated yet" notice. Italian visitors get exactly
 * the same requests and results as before translations existed.
 */
type AnyPage = Record<string, any>

export function useCms() {
    const config = useRuntimeConfig()
    const base = import.meta.server
        ? config.apiInternalBase
        : config.public.apiBase

    // Current language code ("it" | "en" | "fr"), read at call time.
    const nuxtApp = useNuxtApp()
    const currentLocale = (): string => {
        const i18n = (nuxtApp as any).$i18n
        const value = i18n?.locale?.value ?? i18n?.locale
        return typeof value === "string" && value ? value : "it"
    }

    const markFallback = <T extends AnyPage>(page: T): T => ({ ...page, __fallback: true })

    /**
     * List pages of a given Wagtail page type.
     * In English/French: every Italian page is replaced by its translation
     * when one exists, so the list is never shorter than the Italian one.
     */
    async function getPage<T = any>(type: string, params: Record<string, any> = {}) {
        const locale = currentLocale()
        const italian = await $fetch<{ items: T[]; meta?: any }>(`${base}/pages/`, {
            params: { type, fields: "*", locale: "it", ...params },
        })
        if (locale === "it") return italian

        const translated = await $fetch<{ items: T[] }>(`${base}/pages/`, {
            params: { type, fields: "*", ...params, locale },
        }).catch(() => ({ items: [] as T[] }))

        const byKey = new Map<string, T>()
        for (const item of translated.items as AnyPage[]) {
            const key = item?.meta?.translation_key
            if (key) byKey.set(key, item as T)
        }
        return {
            ...italian,
            items: (italian.items as AnyPage[]).map((item) => {
                const key = item?.meta?.translation_key
                return (key && byKey.get(key)) || markFallback(item)
            }) as T[],
        }
    }

    /** One page by type + slug (current language, else Italian). */
    async function getPageBySlug<T = any>(type: string, slug: string): Promise<T | null> {
        const locale = currentLocale()
        const fetchIn = (lang: string) =>
            $fetch<{ items: T[] }>(`${base}/pages/`, { params: { type, fields: "*", slug, locale: lang } })
                .then((res) => res?.items?.[0] ?? null)
                .catch(() => null)

        if (locale !== "it") {
            const translated = await fetchIn(locale)
            if (translated) return translated
            const italian = await fetchIn("it")
            return italian ? (markFallback(italian as AnyPage) as T) : null
        }
        return fetchIn("it")
    }

    /**
     * Resolve a page by its URL path (Italian slugs; translations keep
     * the same slugs). fields=* is required: without it StreamField
     * bodies are missing.
     */
    async function findByPath<T = any>(htmlPath: string) {
        const locale = currentLocale()
        if (locale !== "it") {
            try {
                return await $fetch<T>(`${base}/pages/find/`, {
                    params: { html_path: htmlPath, fields: "*", locale },
                })
            } catch {
                const italian = await $fetch<T>(`${base}/pages/find/`, {
                    params: { html_path: htmlPath, fields: "*" },
                })
                return markFallback(italian as AnyPage) as T
            }
        }
        return await $fetch<T>(`${base}/pages/find/`, {
            params: { html_path: htmlPath, fields: "*" },
        })
    }

    /** People for the team page (Impostazioni → Team), in the current language. */
    async function getTeam<T = any>() {
        return await $fetch<{ members: T[] }>(`${base}/team/`, { params: { locale: currentLocale() } })
    }

    /** Active site theme (falls back to DEFAULT_THEME server-side). */
    async function getActiveTheme<T = any>() {
        return await $fetch<T>(`${base}/themes/active/`)
    }

    return { getPage, getPageBySlug, findByPath, getTeam, getActiveTheme, currentLocale }
}
