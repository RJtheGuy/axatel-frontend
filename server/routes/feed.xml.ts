/**
 * RSS feed of the blog: /feed.xml (Italian, latest 20 posts).
 *
 * Feed readers, news aggregators and search engines use it to discover new
 * articles as soon as they are published in the CMS, without waiting to
 * recrawl the site. Linked from every page's <head> (see app.vue).
 *
 * Links are absolute and use the site address from NUXT_PUBLIC_I18N_BASE_URL
 * (the same one used for the hreflang tags).
 */
const escapeXml = (value: unknown): string =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const rfc822 = (value: string): string => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toUTCString();
};

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event);
    const api = String(config.apiInternalBase || "").replace(/\/$/, "");
    const site = String((config.public as any)?.i18n?.baseUrl || getRequestURL(event).origin).replace(/\/$/, "");

    let items: any[] = [];
    try {
        const res = await $fetch<{ items: any[] }>(`${api}/pages/`, {
            params: { type: "blog.BlogPost", fields: "*", locale: "it", order: "-date", limit: 20 },
        });
        items = res?.items ?? [];
    } catch {
        items = [];
    }

    const entries = items
        .map((p) => {
            const slug = p?.meta?.slug;
            if (!slug) return "";
            const link = `${site}/blog/${encodeURIComponent(slug)}`;
            const date = rfc822(p?.date || p?.meta?.first_published_at || "");
            const image = p?.cover_image?.url;
            return [
                "    <item>",
                `      <title>${escapeXml(p.title)}</title>`,
                `      <link>${escapeXml(link)}</link>`,
                `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
                date ? `      <pubDate>${date}</pubDate>` : "",
                p?.author ? `      <dc:creator>${escapeXml(p.author)}</dc:creator>` : "",
                p?.intro ? `      <description>${escapeXml(p.intro)}</description>` : "",
                ...((p?.tags ?? []) as string[]).map((tag) => `      <category>${escapeXml(tag)}</category>`),
                image ? `      <enclosure url="${escapeXml(image)}" type="image/jpeg" length="0" />` : "",
                "    </item>",
            ]
                .filter(Boolean)
                .join("\n");
        })
        .filter(Boolean)
        .join("\n");

    const newest = items.length ? rfc822(items[0]?.date || "") : "";
    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
        "  <channel>",
        "    <title>Axatel Blog</title>",
        `    <link>${escapeXml(`${site}/blog`)}</link>`,
        `    <atom:link href="${escapeXml(`${site}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
        "    <description>Novità, approfondimenti e aggiornamenti dal mondo Axatel.</description>",
        "    <language>it-IT</language>",
        newest ? `    <lastBuildDate>${newest}</lastBuildDate>` : "",
        entries,
        "  </channel>",
        "</rss>",
        "",
    ]
        .filter((line) => line !== "")
        .join("\n");

    setHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");
    setHeader(event, "Cache-Control", "public, max-age=600");
    return xml + "\n";
});
