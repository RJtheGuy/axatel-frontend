export default defineEventHandler(event => {
    const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
    const secure = url.protocol === "https:";
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";

    if (secure || local) {
        setHeader(event, "Cross-Origin-Opener-Policy", "same-origin");
    }
    // Start with one day; enable longer HSTS and subdomains at the proxy
    // only after all production hosts have working certificates.
    if (secure) setHeader(event, "Strict-Transport-Security", "max-age=86400");
});
