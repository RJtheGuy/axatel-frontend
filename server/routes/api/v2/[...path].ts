/**
 * Same-origin door to the Django API: /api/v2/... on the Nuxt server is
 * forwarded to NUXT_API_INTERNAL_BASE.
 *
 * Why: the browser refuses to read API answers from another address
 * (CORS). When you run the site on your PC (localhost:3000) against the
 * server's API (80.211.135.192), every request made after the first page
 * load was blocked, so pages opened from the menu came up empty.
 * Run the dev server with NUXT_PUBLIC_API_BASE=/api/v2 and the browser
 * talks only to localhost:3000, which passes the request on.
 *
 * On the production server nginx already sends /api/ to Django before it
 * reaches Nuxt, so this route is not used there.
 */
export default defineEventHandler((event) => {
    const base = String(useRuntimeConfig(event).apiInternalBase || "").replace(/\/$/, "");
    const rest = event.path.replace(/^\/api\/v2/, "");
    return proxyRequest(event, `${base}${rest}`);
});
