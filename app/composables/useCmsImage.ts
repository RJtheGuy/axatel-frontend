export function useCmsImage() {
    const config = useRuntimeConfig();
    // Image addresses end up in the visitor's browser, so always use the
    // PUBLIC API address (never the internal one). When it is relative
    // (NUXT_PUBLIC_API_BASE=/api/v2) the CMS URLs are already complete.
    const publicBase = String(config.public.apiBase || "");
    const origin = /^https?:\/\//.test(publicBase) ? publicBase.replace(/\/api\/v\d+\/?$/, "") : "";

    function imageUrl(path: string | null | undefined): string {
        if (!path) return "";
        if (path.startsWith("data:")) return path;

        if (/^(https?:)?\/\//.test(path)) {
            if (!origin) return path;
            const parsed = new URL(path, origin);
            if (parsed.pathname.startsWith("/media/") || parsed.pathname.startsWith("/documents/")) {
                return `${origin}${parsed.pathname}${parsed.search}`;
            }
            return path;
        }

        if (path.startsWith("/media/") || path.startsWith("media/")) {
            return `${origin}/${path.replace(/^\//, "")}`;  // origin "" keeps it on the site's address
        }
        return path;
    }

    return { imageUrl };
}
