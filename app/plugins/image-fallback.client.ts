export default defineNuxtPlugin(() => {
    // Bundled Axatel logo (see utils/resolveImage.ts).
    const fallbackUrl = new URL(imageFallbackUrl, window.location.href).href;

    document.addEventListener(
        "error",
        (event) => {
            const image = event.target;
            if (!(image instanceof HTMLImageElement)) return;
            if (image.dataset.fallbackApplied === "true") return;
            if (image.currentSrc === fallbackUrl || image.src === fallbackUrl) return;

            image.dataset.fallbackApplied = "true";
            image.src = fallbackUrl;
        },
        true,
    );
});
