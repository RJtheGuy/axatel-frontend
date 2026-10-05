import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import vm from "node:vm";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function loadTheme(fetchTheme, warnings = []) {
    const hooks = new Map();
    const properties = new Map();
    const source = read("app/plugins/theme.client.ts")
        .replace("export default", "globalThis.plugin =")
        .replace("import.meta.server", "false");
    const context = vm.createContext({
        defineNuxtPlugin: callback => callback,
        useCms: () => ({ getActiveTheme: fetchTheme }),
        document: { documentElement: { style: { setProperty: (key, value) => properties.set(key, value) } } },
        console: { warn: (...args) => warnings.push(args) }
    });
    vm.runInContext(stripTypeScriptTypes(source), context);
    const result = context.plugin({ hook: (name, callback) => hooks.set(name, callback) });
    return { hooks, properties, result };
}

test("theme network requests do not block plugin setup or app mounting", async () => {
    let resolve;
    let requested = false;
    const theme = new Promise(done => { resolve = done; });
    const loaded = loadTheme(() => { requested = true; return theme; });
    assert.equal(loaded.result, undefined);
    assert.equal(requested, false);
    assert.equal(loaded.hooks.get("app:mounted")(), undefined);
    assert.equal(requested, true);
    resolve({ background_color: "#123456", primary_color: "#abcdef" });
    await theme;
    await new Promise(setImmediate);
    assert.equal(loaded.properties.get("--ax-color-bg-main"), "#123456");
    assert.equal(loaded.properties.get("--ax-color-accent-red"), "#abcdef");
});

test("theme failure preserves defaults and explicitly reports the error", async () => {
    const warnings = [];
    const loaded = loadTheme(async () => { throw new Error("CMS unavailable"); }, warnings);
    loaded.hooks.get("app:mounted")();
    await new Promise(setImmediate);
    assert.equal(loaded.properties.size, 0);
    assert.equal(warnings.length, 1);
});

test("global styles and the centered hero video are available on every screen size", () => {
    assert.match(read("nuxt.config.ts"), /css:\s*\['~\/assets\/scss\/main\.scss'\]/);
    const hero = read("app/components/dashboard/Citazione.vue");
    assert.match(hero, /<video class="hero-video" autoplay muted loop playsinline/);
    assert.match(hero, /object-fit:\s*cover/);
    assert.match(hero, /object-position:\s*center/);
    assert.doesNotMatch(hero, /videoEnabled|videoMediaQuery|display:\s*none/);
    assert.doesNotMatch(read("app/pages/index.vue"), /showDeferredContent|revealDeferredContent|contentSentinel/);
});

test("initial server HTML contains every dashboard section and indexable links without JavaScript", {
    skip: !process.env.HOMEPAGE_TEST_URL
}, async () => {
    const response = await fetch(process.env.HOMEPAGE_TEST_URL);
    assert.equal(response.status, 200);
    const html = await response.text();
    const body = html.match(/<body[\s\S]*?<\/body>/)?.[0].split("<script")[0] ?? "";
    for (const section of ["citazione-section", "spiegazione-section", "demo-section", "casi-section", "footer-section"]) {
        assert.ok(body.includes(section), `${section} must exist before any JavaScript executes`);
    }
    assert.match(body, /Sistemi di monitoraggio/);
    assert.match(body, /href="\/(?:casi|articoli)\//);
    assert.match(body, /href="mailto:info@axatel\.it"/);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /<link rel="stylesheet"[^>]+\/_nuxt\//);
    assert.doesNotMatch(html, /<link[^>]+href="[^"]*video_hero[^"]*"/,
        "Nuxt must not duplicate the video's native loading with speculative prefetch");
});
