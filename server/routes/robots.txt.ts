/**
 * robots.txt. Once indexing is switched on (CMS → Impostazioni → Motori di
 * ricerca, on the real domain) everything may be crawled and the sitemap
 * address is given so search engines find every page
 * (server/routes/sitemap.xml.ts); until then everything is blocked
 * (server/middleware/indexing.ts decides). The address follows
 * NUXT_PUBLIC_I18N_BASE_URL, like the sitemap.
 */
export default defineEventHandler((event) => {
    const config = useRuntimeConfig(event);
    const site = String((config.public as any)?.i18n?.baseUrl || getRequestURL(event).origin).replace(/\/$/, "");
    setHeader(event, "Content-Type", "text/plain; charset=utf-8");
    setHeader(event, "Cache-Control", "public, max-age=600");
    if (!event.context.allowIndexing) {
        return "# Not open to search engines yet (CMS: Impostazioni → Motori di ricerca)\nUser-agent: *\nDisallow: /\n";
    }
    return `User-agent: *\nDisallow:\n\nSitemap: ${site}/sitemap.xml\n`;
});
