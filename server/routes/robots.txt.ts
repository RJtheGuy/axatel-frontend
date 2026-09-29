/**
 * robots.txt: everything may be crawled, and the sitemap address is given
 * so search engines find every page (server/routes/sitemap.xml.ts).
 * The address follows NUXT_PUBLIC_I18N_BASE_URL, like the sitemap.
 */
export default defineEventHandler((event) => {
    const config = useRuntimeConfig(event);
    const site = String((config.public as any)?.i18n?.baseUrl || getRequestURL(event).origin).replace(/\/$/, "");
    setHeader(event, "Content-Type", "text/plain; charset=utf-8");
    setHeader(event, "Cache-Control", "public, max-age=3600");
    return `User-agent: *\nDisallow:\n\nSitemap: ${site}/sitemap.xml\n`;
});
