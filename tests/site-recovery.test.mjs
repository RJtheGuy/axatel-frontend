import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { parse, compileTemplate } from "@vue/compiler-sfc";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

async function casePage(file, response, extra = {}) {
    const { descriptor } = parse(read(`app/pages/casi/${file}.vue`));
    const script = descriptor.scriptSetup.content.replace(/^import .*;\r?$/gm, "");
    // The pages use app/utils/cmsError.ts (404 vs 503): run the real helper.
    const helper = read("app/utils/cmsError.ts").replace(/^export /gm, "").replace("import.meta.client", "false");
    const code = stripTypeScriptTypes(helper + "\n" + script);
    return runInNewContext(`(async () => { ${code}; return ${file === "index" ? "cases.value" : "caso.value"}; })()`, {
        computed: fn => ({ get value() { return fn(); } }),
        useRoute: () => ({ params: { slug: "known-case" }, query: {} }),
        useRouter: () => ({ replace() {} }),
        // The pages are translated: keys stand in for the texts.
        useI18n: () => ({ t: (key) => key, locale: { value: "it" } }),
        useLocalePath: () => (path) => path,
        useNuxtApp: () => ({ $i18n: { t: (key) => key } }),
        useCms: () => ({ getPage: response, getPageBySlug: response }),
        useCmsImage: () => ({ imageUrl: image => image }),
        useAsyncData: async (_key, handler) => {
            try { return { data: { value: await handler() }, error: { value: null } }; }
            catch (error) { return { data: { value: null }, error: { value: error } }; }
        },
        successCases: [{ title: "Existing case", slug: "known-case", image: "/_nuxt/case.webp" }],
        homepageCases: [{ slug: "known-case", content: "<p>Existing complete article</p>" }],
        useSeoMeta() {},
        useHead() {},
        createError: options => Object.assign(new Error(options.statusMessage), options),
        ...extra
    });
}

test("all Vue templates compile", () => {
    const visit = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? visit(path) : path.endsWith(".vue") ? [path] : [];
    });
    for (const filename of visit(fileURLToPath(new URL("../app", import.meta.url)))) {
        const { descriptor, errors } = parse(readFileSync(filename, "utf8"), { filename });
        assert.equal(errors.length, 0, filename);
        if (descriptor.template) {
            const result = compileTemplate({ source: descriptor.template.content, filename, id: filename });
            assert.equal(result.errors.length, 0, `${filename}: ${result.errors}`);
        }
    }
});

test("cases fallback only after a failed CMS request", async () => {
    const offline = await casePage("index", async () => { throw new Error("CMS offline"); });
    assert.equal(offline[0].slug, "known-case");
    const empty = await casePage("index", async () => ({ items: [] }));
    assert.equal(empty.length, 0);
    const published = await casePage("index", async () => ({
        items: [{ title: "CMS case", meta: { slug: "cms-case" } }]
    }));
    assert.equal(published[0].slug, "cms-case");
});

test("offline case details retain the complete existing article and bundled image", async () => {
    const page = await casePage("[slug]", async () => { throw new Error("CMS offline"); });
    assert.equal(page.body, "<p>Existing complete article</p>");
    assert.equal(page.cover_image.url, "/_nuxt/case.webp");
});

test("a successful missing CMS case stays 404, not a republished fallback", async () => {
    await assert.rejects(casePage("[slug]", async () => null), error => error.statusCode === 404);
});

test("unknown offline case reports CMS unavailability rather than false 404", async () => {
    await assert.rejects(
        casePage("[slug]", async () => { throw new Error("CMS offline"); }, { successCases: [] }),
        error => error.statusCode === 503
    );
});

test("bundled image resolver works without Nuxt context and rejects missing assets", () => {
    const source = read("app/utils/resolveImage.ts");
    const functionSource = source.slice(source.indexOf("export function resolveBundledImage"), source.indexOf("export function resolveImage"));
    const resolve = runInNewContext(`${stripTypeScriptTypes(functionSource.replace("export ", ""))}; resolveBundledImage`, {
        images: { "../assets/immagini/team.png": "/_nuxt/team.png" }
    });
    assert.equal(resolve("/immagini/team.png"), "/_nuxt/team.png");
    assert.throws(() => resolve("missing.png"), /Image not found/);
    for (const file of ["team", "monitoring", "contentPages"]) {
        assert.match(read(`app/data/${file}.ts`), /resolveBundledImage as resolveImage/);
    }
});
