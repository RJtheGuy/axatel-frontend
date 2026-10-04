/**
 * Uploaded files (/media/...) on the site's own address.
 *
 * On the server nginx serves /media/ itself before Nuxt is reached, so this
 * is only used when the site runs without nginx (e.g. on your PC). It keeps
 * logos and pictures from the CMS on the same address as the page, which
 * the particle animation needs to read them.
 */
export default defineEventHandler((event) => {
    const api = String(useRuntimeConfig(event).apiInternalBase || "");
    const origin = api.replace(/\/api\/v2\/?$/, "").replace(/\/$/, "");
    return proxyRequest(event, `${origin}${event.path}`);
});
