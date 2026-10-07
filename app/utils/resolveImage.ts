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

import titleWingImage from "../assets/immagini/ala-axatel.png";
import dashboardWingImage from "../assets/immagini/ala.png";

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

/** Built-in wings: next to page titles, and in the homepage quote. */
export const DEFAULT_WING_IMAGE = titleWingImage;
export const DASHBOARD_WING_IMAGE = dashboardWingImage;

/**
 * A bundled image by file name, for static data modules (no CMS override,
 * no Nuxt context). A missing file is an error, caught by the tests/build.
 */
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

/** Wing next to page titles: the one uploaded in the CMS, else the built-in one. */
export function headerWing(): string {
    return overrides.get("ala.png") || DEFAULT_WING_IMAGE;
}

/** Wing in the homepage quote: the one uploaded in the CMS, else the built-in one. */
export function homeWing(): string {
    return overrides.get("ala.png") || DASHBOARD_WING_IMAGE;
}
