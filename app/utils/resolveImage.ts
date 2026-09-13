// app/utils/resolveImage.ts
//
// Single source of truth for resolving frontend image paths to backend media.
// Nuxt auto-imports everything in app/utils/, so `resolveImage(...)` is
// usable directly in any component template or <script setup>.
//
// Covers every subfolder under assets/immagini/ (casi-di-successo/,
// flat top-level files like Angel.png, etc.) in one glob, so every data
// file (contentPages.ts, monitoring.ts, team.ts, articleSettings.json)
// and every component can resolve images the same way successCases.ts
// already did for its own narrower case.

const images = import.meta.glob<string>(
    "../assets/immagini/**/*.{png,jpg,jpeg,webp,svg,gif}",
    { eager: true, import: "default" }
);

export function resolveImage(pathOrFilename: string | undefined | null): string {
    const config = useRuntimeConfig();
    const apiBase = import.meta.server ? config.apiInternalBase : config.public.apiBase;
    const backendOrigin = apiBase.replace(/\/api\/v\d+\/?$/, "");
    const fallback = `${backendOrigin}/media/frontend/immagini/Axatel.svg`;

    if (!pathOrFilename) return fallback;

    // CMS and external URLs already point to their source of truth.
    if (/^(https?:)?\/\//.test(pathOrFilename) || pathOrFilename.startsWith("data:")) {
        return pathOrFilename;
    }

    // Accept old-style values in any of these shapes:
    //   "/immagini/Angel.png"
    //   "immagini/Angel.png"
    //   "Angel.png"
    //   "casi-di-successo/ss51-alemagna.webp"
    const clean = pathOrFilename.replace(/^\/?immagini\//, "").replace(/^\//, "");

    const match = Object.entries(images).find(
        ([path]) => path.endsWith(`/${clean}`) || path.endsWith(clean)
    );

    if (!match) {
        console.warn(`[resolveImage] not found under assets/immagini/: ${pathOrFilename}`);
        return fallback;
    }

    return `${backendOrigin}/media/frontend/immagini/${clean}`;
}