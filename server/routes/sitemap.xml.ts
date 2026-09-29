/**
 * Sitemap for search engines: /sitemap.xml
 *
 * Lists every public page of the site in Italian, English and French, with
 * hreflang links between the three versions (so Google shows each visitor
 * the right language). Two sources:
 *   - the pages built into the site (home, lists, company pages, the
 *     monitoring and solution topics while they're not in the CMS yet);
 *   - the pages published in the CMS (case studies, blog posts, products,
 *     solutions, monitoring topics, services, free pages), read live, so a
 *     new article appears here as soon as it is published.
 *
 * Addresses use the site address from NUXT_PUBLIC_I18N_BASE_URL (the same
 * one used by the hreflang tags and the RSS feed). Referenced by robots.txt.
 */

// Built-in pages with real content (the "coming soon" placeholders are left
// out: search engines would treat them as empty pages).
const BUILT_IN = [
    "/",
    "/casi",
    "/monitoraggio",
    "/soluzioni",
    "/prodotti",
    "/servizi",
    "/blog",
    "/contatti",
    "/azienda/team",
    "/azienda/chi-siamo",
    "/azienda/bilancio-sostenibilita",
    "/azienda/invia-il-cv",
    "/azienda/diventa-partner",
    "/approfondimenti/glossario",
    ...["aria", "fiumi", "frane", "traffico", "cantieri", "ponti", "edifici"].map((s) => `/monitoraggio/${s}`),
    ...[
        "angel-bpm", "analitici", "sensori", "telecamere-intelligenti", "lorawan", "networking",
        "firmware", "scada", "plc", "progettazione", "direzione-lavori", "control-room",
    ].map((s) => `/soluzioni/${s}`),
];

// CMS page type → address prefix on the site.
const CMS_TYPES: Record<string, string> = {
    "casi.CasoSuccessoPage": "/casi",
    "blog.BlogPost": "/blog",
    "products.ProductPage": "/prodotti",
    "solutions.SolutionPage": "/soluzioni",
    "monitoring.MonitoringPage": "/monitoraggio",
    "services.ServicePage": "/servizi",
    // Free pages can sit under other free pages: their address comes from the CMS.
    "home.FlexPage": "",
};

const LOCALES = [
    { code: "it", hreflang: "it-IT", prefix: "" },
    { code: "en", hreflang: "en-GB", prefix: "/en" },
    { code: "fr", hreflang: "fr-FR", prefix: "/fr" },
];

const escapeXml = (value: string): string =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function cmsPaths(api: string, type: string, prefix: string): Promise<string[]> {
    const paths: string[] = [];
    // The API returns at most 20 items per request.
    for (let offset = 0; offset < 1000; offset += 20) {
        const res = await $fetch<{ items: Array<{ meta?: { slug?: string; html_url?: string } }> }>(`${api}/pages/`, {
            params: { type, fields: "_,slug,html_url", locale: "it", limit: 20, offset },
        }).catch(() => null);
        const items = res?.items ?? [];
        for (const { meta } of items) {
            if (!meta?.slug) continue;
            if (prefix) {
                paths.push(`${prefix}/${meta.slug}`);
            } else if (meta.html_url) {
                const path = new URL(meta.html_url, "http://x").pathname.replace(/\/$/, "");
                if (path) paths.push(path);
            }
        }
        if (items.length < 20) break;
    }
    return paths;
}

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event);
    const api = String(config.apiInternalBase || "").replace(/\/$/, "");
    const site = String((config.public as any)?.i18n?.baseUrl || getRequestURL(event).origin).replace(/\/$/, "");

    const cms = await Promise.all(
        Object.entries(CMS_TYPES).map(([type, prefix]) => cmsPaths(api, type, prefix))
    );
    const paths = [...new Set([...BUILT_IN, ...cms.flat()])];

    const href = (prefix: string, path: string) => `${site}${prefix}${path === "/" && prefix ? "" : path}`;
    const urls = paths.flatMap((path) => {
        const alternates = [
            ...LOCALES.map(
                (l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${escapeXml(href(l.prefix, path))}" />`
            ),
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(href("", path))}" />`,
        ].join("\n");
        return LOCALES.map(
            (l) => `  <url>\n    <loc>${escapeXml(href(l.prefix, path))}</loc>\n${alternates}\n  </url>`
        );
    });

    setHeader(event, "Content-Type", "application/xml; charset=utf-8");
    setHeader(event, "Cache-Control", "public, max-age=3600");
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        ...urls,
        "</urlset>",
        "",
    ].join("\n");
});
