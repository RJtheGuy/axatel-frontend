// app/utils/resolveImage.ts
//
// Single source of truth for resolving the old `/immagini/...` static
// paths (from public/) to real Vite asset URLs now that images live in
// assets/immagini/ instead. Nuxt auto-imports everything in app/utils/,
// so `resolveImage(...)` is usable directly in any component template
// or <script setup>, no import statement needed — this is what
// Angel.vue's template was already calling before this file existed.
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
    if (!pathOrFilename) return "";

    // Already a real URL (e.g. a Wagtail-hosted image from the CMS, or
    // any other external/absolute source) — pass through untouched.
    if (/^(https?:)?\/\//.test(pathOrFilename) || pathOrFilename.startsWith("data:")) {
        return pathOrFilename;
    }

    // Accepts old-style values in any of these shapes:
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
        return "";
    }

    return match[1];
}