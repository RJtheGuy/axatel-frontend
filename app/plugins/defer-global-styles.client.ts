export default defineNuxtPlugin(() => {
    const loadGlobalStyles = () => {
        void import("~/assets/scss/main.scss");
    };

    window.addEventListener("load", () => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(loadGlobalStyles, { timeout: 1200 });
            return;
        }

        setTimeout(loadGlobalStyles, 300);
    }, { once: true });
});