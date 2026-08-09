/**
 * Site-wide theme: colors, fonts, shape.
 *
 * The Django side of this (ThemeSettings + /api/v2/themes/active/) has
 * worked since earlier in this build - this composable is what finally
 * makes an editor's change in Impostazioni → Tema show up on the actual
 * site. Same useAsyncData pattern as useSiteSettings.ts: fetch once per
 * page load, fail soft to whatever nuxt_config.ts's static :root block
 * already has rather than breaking the page if the API is unreachable.
 *
 * Maps the API's field names onto the SAME --ax-color-* custom
 * properties every Cms*.vue component already reads - so no component
 * needs to change again for this to take effect. A few variables here
 * (bg-panel, the overlay alphas, accent-red-border) don't have a 1:1
 * field in ThemeSettings; color-mix() derives them from the nearest
 * real field instead of asking Django for five near-duplicate colors
 * an editor would never meaningfully tell apart. color-mix() needs a
 * reasonably current browser (Chrome 111+/Safari 16.2+/Firefox 113+) -
 * on anything older these derived variables silently fall through to
 * the static fallback value instead of erroring.
 *
 * Call this once, near the root of the app (see app.vue) - not per
 * component. useHead's reactive style tag updates automatically once
 * the fetch resolves.
 */

export interface ActiveTheme {
    name: string;
    primary_color: string;
    accent_color: string;
    text_color: string;
    background_color: string;
    success_color: string;
    warning_color: string;
    danger_color: string;
    surface_color: string;
    border_color: string;
    muted_color: string;
    heading_font: string;
    body_font: string;
    base_font_size: number;
    type_scale: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };
    radius: string;
    shadow: string;
    logo_url: string | null;
    can_restore_previous?: boolean;
}

function toCssVariables(theme: ActiveTheme): string {
    return `
        --ax-color-bg-main:${theme.background_color};
        --ax-color-bg-surface:${theme.surface_color};
        --ax-color-bg-panel:color-mix(in srgb, ${theme.surface_color} 74%, transparent);
        --ax-color-text-primary:${theme.text_color};
        --ax-color-text-secondary:color-mix(in srgb, ${theme.text_color} 80%, ${theme.muted_color});
        --ax-color-text-muted:${theme.muted_color};
        --ax-color-border-soft:color-mix(in srgb, ${theme.border_color} 60%, transparent);
        --ax-color-border-card:color-mix(in srgb, ${theme.border_color} 70%, transparent);
        --ax-card-radius:${theme.radius};
        --ax-color-accent-red:${theme.primary_color};
        --ax-color-accent-red-soft:${theme.accent_color};
        --ax-color-accent-red-border:color-mix(in srgb, ${theme.accent_color} 80%, white);
        --ax-color-overlay-dark-strong:color-mix(in srgb, ${theme.background_color} 92%, transparent);
        --ax-color-overlay-dark-medium:color-mix(in srgb, ${theme.background_color} 78%, transparent);
        --ax-color-overlay-dark-soft:color-mix(in srgb, ${theme.background_color} 45%, transparent);
        --ax-font-heading:${theme.heading_font};
        --ax-font-body:${theme.body_font};
        --ax-base-font-size:${theme.base_font_size}px;
    `.replace(/\s+/g, " ").trim();
}

export function useTheme() {
    const config = useRuntimeConfig();
    const base = import.meta.server ? config.apiInternalBase : config.public.apiBase;

    const { data: theme } = useAsyncData<ActiveTheme | null>("active-theme", () =>
        $fetch<ActiveTheme>(`${base}/themes/active/`).catch(() => null)
    );

    useHead(() => ({
        style: theme.value
            ? [
                  {
                      // `html:root` (element + pseudo-class) outweighs the
                      // plain `:root` selector in nuxt_config.ts's static
                      // block on specificity alone, so this always wins
                      // regardless of which <style> tag the browser parses
                      // first - no !important needed for the variables.
                      innerHTML: `html:root{${toCssVariables(theme.value)}}
                          html *{font-family:var(--ax-font-body,Montserrat,sans-serif)}
                          html h1,html h2,html h3,html h4,html h5,html h6{font-family:var(--ax-font-heading,Montserrat,sans-serif)}`,
                  },
              ]
            : [],
    }));

    return { theme };
}
