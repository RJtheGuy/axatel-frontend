export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase;
    const backendOrigin = apiBase.replace(/\/api\/v\d+\/?$/, "");
    const fallbackUrl = `${backendOrigin}/media/frontend/immagini/Axatel.svg`;

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
