// app/utils/resolveImage.ts
//
// Single source of truth for resolving frontend image paths (app/assets/immagini).
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

/**
 * The images live in app/assets/immagini and are bundled with the site, so
 * they are always served by the site itself (same address as the page).
 *
 * They used to be loaded from the backend at /media/frontend/immagini/, which
 * only works if someone copied the folder onto the server by hand: on the
 * server ala.png was missing (404), and from localhost the browser blocked
 * them (CORS), so the particle hero showed a broken shape instead of the wing.
 */
const fallback = Object.entries(images).find(([path]) => path.endsWith("/Axatel.svg"))?.[1] ?? "";

// Pictures replaced from the CMS (Impostazioni → Logo e immagini del sito),
// by built-in file name, e.g. "ala.png" → the uploaded wing. Set once per
// page load by plugins/branding.ts.
const overrides = new Map<string, string>();

export function setImageOverrides(entries: Record<string, string | null | undefined>): void {
    overrides.clear();
    for (const [name, url] of Object.entries(entries)) {
        if (url) overrides.set(name, url);
    }
}

export function resolveImage(pathOrFilename: string | undefined | null): string {
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

    const override = overrides.get(clean);
    if (override) return override;

    const match = Object.entries(images).find(([path]) => path.endsWith(`/${clean}`));

    if (!match) {
        console.warn(`[resolveImage] not found under assets/immagini/: ${pathOrFilename}`);
        return fallback;
    }

    return match[1];
}

/** URL of the Axatel logo, used when an image can't be loaded. */
export const imageFallbackUrl = fallback;
