export type CmsImageReference = string | { url?: string | null } | null | undefined;

export function useCmsImage() {
    const config = useRuntimeConfig();
    const apiBase = import.meta.server ? config.apiInternalBase : config.public.apiBase;
    const origin = apiBase.replace(/\/api\/v\d+\/?$/, "");

    function imageUrl(image: CmsImageReference): string {
        const path = typeof image === "string" ? image : image?.url;
        if (!path) return "";
        if (path.startsWith("data:")) return path;

        if (/^(https?:)?\/\//.test(path)) {
            const parsed = new URL(path, origin);
            if (parsed.pathname.startsWith("/media/") || parsed.pathname.startsWith("/documents/")) {
                return `${origin}${parsed.pathname}${parsed.search}`;
            }
            return path;
        }

        if (path.startsWith("/media/") || path.startsWith("media/")) {
            return `${origin}/${path.replace(/^\//, "")}`;
        }
        return path;
    }

    return { imageUrl };
}
