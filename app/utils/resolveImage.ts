// app/utils/resolveImage.ts
//
// Runtime CMS images and context-free bundled images use separate resolvers.
// Nuxt auto-imports everything in app/utils/, so `resolveImage(...)` is
// usable directly in any component template or <script setup>.
//
// Covers every subfolder under assets/immagini/ (casi-di-successo/,
// flat top-level files like Angel.png, etc.) in one glob. Static data
// modules must use resolveBundledImage, which needs no Nuxt context.

import titleWingImage from "../assets/immagini/ala-axatel.png";
import dashboardWingImage from "../assets/immagini/ala.png";

const images = import.meta.glob<string>(
    "../assets/immagini/**/*.{png,jpg,jpeg,webp,svg,gif}",
    { eager: true, import: "default" }
);

export const DEFAULT_WING_IMAGE = titleWingImage;
export const DASHBOARD_WING_IMAGE = dashboardWingImage;

export function resolveBundledImage(pathOrFilename: string): string {
    if (/^(https?:)?\/\//.test(pathOrFilename) || pathOrFilename.startsWith("data:")) {
        return pathOrFilename;
    }
    const clean = pathOrFilename.replace(/^\/?immagini\//, "").replace(/^\//, "");
    const match = Object.entries(images).find(([path]) => path.endsWith(`/${clean}`));
    if (!match) {
        throw new Error(`[resolveBundledImage] Image not found: ${pathOrFilename}`);
    }
    return match[1];
}

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