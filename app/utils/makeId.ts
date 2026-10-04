/**
 * A unique id for things saved in the visitor's browser (e.g. demo alarms).
 *
 * crypto.randomUUID() only exists on HTTPS pages (and localhost): on a plain
 * http:// address it is undefined, which silently broke the homepage demo.
 * This works everywhere.
 */
export function makeId(): string {
    const c = globalThis.crypto as Crypto | undefined;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    const random = c && typeof c.getRandomValues === "function"
        ? Array.from(c.getRandomValues(new Uint32Array(2)), (n) => n.toString(36)).join("")
        : Math.random().toString(36).slice(2);
    return `${Date.now().toString(36)}-${random}`;
}
