// Apply remote overrides after mounting so CMS latency cannot block hydration.
export default defineNuxtPlugin((nuxtApp) => {
    const { getActiveTheme } = useCms();

    nuxtApp.hook("app:mounted", () => {
        void applyTheme();
    });

    async function applyTheme(): Promise<void> {
        try {
            const theme = await getActiveTheme<any>();
            if (!theme) return;

            const root = document.documentElement;
            const set = (name: string, value: unknown) => {
                if (value === null || value === undefined || value === "") return;
                root.style.setProperty(name, String(value));
            };

            set("--ax-color-bg-main", theme.background_color);
            set("--ax-color-bg-surface", theme.surface_color);
            set("--ax-color-text-primary", theme.text_color);
            set("--ax-color-text-muted", theme.muted_color);
            set("--ax-color-border-soft", theme.border_color);
            set("--ax-color-accent-red", theme.primary_color);
            set("--ax-color-accent-red-soft", theme.accent_color);
            set("--color-primary", theme.background_color);
            set("--color-secondary", theme.primary_color);
            set("--ax-font-heading", theme.heading_font);
            set("--ax-font-body", theme.body_font);
            set("--ax-card-radius", theme.radius);

            if (theme.base_font_size) {
                root.style.fontSize = `${theme.base_font_size}px`;
            }
        } catch (error) {
            console.warn("[theme] failed to load active theme, using static defaults", error);
        }
    }
});
