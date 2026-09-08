// app/plugins/theme.client.ts
//
// Fetches the active theme once on app load and applies it as CSS
// custom properties on <html>, overriding the static defaults set in
// nuxt.config.ts's app.head.style block. Client-only (.client.ts
// suffix) since it manipulates document.documentElement directly —
// there's nothing to do server-side here.
//
// Deliberately fails silent: if the fetch errors, times out, or the
// backend isn't reachable, this plugin does nothing at all and the
// site renders with the exact static look it already has today. Same
// fallback philosophy as every other CMS wiring this session — a CMS
// outage should never be able to break the live site, only prevent it
// from reflecting the latest edit.

export default defineNuxtPlugin(async () => {
    if (import.meta.server) return;

    const { getActiveTheme } = useCms();

    try {
        const theme = await getActiveTheme<any>();
        if (!theme) return;

        const root = document.documentElement;
        const set = (name: string, value: unknown) => {
            if (value === null || value === undefined || value === "") return;
            root.style.setProperty(name, String(value));
        };

        // Colors — same --ax-color-* variable names the static block
        // already defines, so every existing component that reads them
        // (all the Cms*.vue components, dashboard components, etc.)
        // picks up the change with zero changes to those files.
        set("--ax-color-bg-main", theme.background_color);
        set("--ax-color-bg-surface", theme.surface_color);
        set("--ax-color-text-primary", theme.text_color);
        set("--ax-color-text-muted", theme.muted_color);
        set("--ax-color-border-soft", theme.border_color);
        set("--ax-color-accent-red", theme.primary_color);
        set("--ax-color-accent-red-soft", theme.accent_color);
        set("--color-primary", theme.background_color);
        set("--color-secondary", theme.primary_color);

        // Fonts — these variables don't exist in the static block by
        // default; they need the two-line nuxt.config.ts edit
        // (nuxt_config_font_diff) for this to actually take visual
        // effect. Setting them here is harmless even without that
        // edit — they just won't be read by anything yet.
        set("--ax-font-heading", theme.heading_font);
        set("--ax-font-body", theme.body_font);

        // Shape
        set("--ax-card-radius", theme.radius);

        // Base font size — applied to <html> so rem-based sizing
        // throughout the site scales from it automatically.
        if (theme.base_font_size) {
            root.style.fontSize = `${theme.base_font_size}px`;
        }
    } catch (error) {
        // Deliberately silent beyond a console warning — see module
        // docstring. A broken/unreachable theme endpoint must never
        // break the page.
        console.warn("[theme] failed to load active theme, using static defaults", error);
    }
});