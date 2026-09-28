/**
 * Site-wide settings: navbar links, header CTA, footer, chat widget.
 *
 * One request for all of them (see core/settings_views.py). Cached by
 * useAsyncData under a fixed key, so it is fetched once per page load
 * rather than once per component that needs it.
 *
 * Fails soft: on error the caller falls back to its own defaults rather
 * than the navbar disappearing.
 */

export interface NavLink {
    label: string
    href: string
    open_in_new_tab?: boolean
}

export interface SiteSettings {
    navigation: {
        items: Array<{
            label: string
            href?: string | null
            groups?: Array<{ label: string; links: NavLink[] }>
        }>
        cta: { visible: boolean; label: string; url: string; label_is_fallback?: boolean }
    }
    footer: {
        contacts: Array<{ title: string; value: string; href: string; external?: boolean }>
        vat_label: string
        vat_value: string
        tax_label: string
        tax_value: string
    }
    chatbot: {
        enabled: boolean
        title: string
        welcome_message: string
        placeholder: string
        suggestions?: string[]
    }
}

export function useSiteSettings() {
    const config = useRuntimeConfig()
    const base = import.meta.server ? config.apiInternalBase : config.public.apiBase

    // Menu labels come back in the visitor's language (?locale=en uses the
    // "Etichetta EN" fields, falling back to Italian). Cached per language.
    const { locale } = useI18n()
    const { data: settings } = useAsyncData<SiteSettings | null>(
        () => `site-settings-${locale.value}`,
        () => $fetch<SiteSettings>(`${base}/site-settings/`, { params: { locale: locale.value } }).catch(() => null),
        { watch: [locale] }
    )

    return { settings }
}