<template>
    <main class="prod-page">
        <header class="prod-hero">
            <ArticleParticleHero :title="t('products.title')" :asset-url="headerWing()" />
        </header>

        <div class="prod-light-stage">
            <section class="prod-shell">
                <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

                <div class="page-kicker">{{ t("products.kicker") }}</div>
                <p class="lead">{{ lead }}</p>
                <LayoutTranslationNotice v-if="hasUntranslated" />

                <p v-if="!items.length" class="empty">{{ t("products.empty") }}</p>

                <!-- Category bar (update 73): one entry per category that has products,
                     the number of products shown on hover; a click shows only that
                     category. Search: name, codes, models and description, as you type.
                     Both are kept in the address (?categoria=…&q=…) so a filtered list
                     can be shared, as on Casi di successo. -->
                <div v-if="items.length" class="prod-tools">
                    <div v-if="categoryList.length" class="cat-bar" role="group" :aria-label="L.filterLabel">
                        <button type="button" class="cat" :aria-pressed="!activeCategory" @click="setCategory('')">
                            {{ L.all }}
                            <span class="count" aria-hidden="true">{{ items.length }}</span>
                            <span class="sr-only">({{ items.length }})</span>
                        </button>
                        <button
                            v-for="c in categoryList"
                            :key="c.key"
                            type="button"
                            class="cat"
                            :aria-pressed="activeCategory === c.key"
                            @click="setCategory(c.key)"
                        >
                            {{ c.label }}
                            <span class="count" aria-hidden="true">{{ c.count }}</span>
                            <span class="sr-only">({{ c.count }})</span>
                        </button>
                    </div>

                    <div class="search">
                        <label class="sr-only" for="prod-search">{{ L.searchLabel }}</label>
                        <span class="search-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" /><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
                        </span>
                        <input
                            id="prod-search"
                            v-model="query"
                            type="search"
                            :placeholder="L.placeholder"
                            autocomplete="off"
                            enterkeyhint="search"
                        />
                        <button v-if="query" type="button" class="clear" :aria-label="L.clear" @click="query = ''">×</button>
                    </div>

                    <p v-if="isFiltering" class="result-count" aria-live="polite">{{ resultLabel }}</p>
                </div>

                <div v-if="isFiltering && !filtered.length && query.trim()" class="no-match">
                    <p>{{ L.noMatch }}</p>
                    <button type="button" @click="resetFilters">{{ L.showAll }}</button>
                </div>

                <div v-if="activeCategory && !query.trim() && !filtered.length" class="no-match">
                    <p>{{ L.emptyCategory }}</p>
                    <button type="button" @click="resetFilters">{{ L.showAll }}</button>
                </div>

                <div v-if="visible.length" class="prod-grid" :class="gridClass">
                    <NuxtLink
                        v-for="item in visible"
                        :key="item.slug"
                        :to="localePath(`/prodotti/${item.slug}`)"
                        class="prod-card"
                    >
                        <span class="media" :style="mediaStyle(item)">
                            <ContentResponsiveImage
                                v-if="item.image"
                                :src="item.image.url"
                                :alt="item.image.alt || item.title"
                                :width="400"
                                :height="225"
                                sizes="100vw sm:50vw lg:400px"
                            />
                            <span v-else class="placeholder" aria-hidden="true">{{ item.title }}</span>
                        </span>
                        <span class="body">
                            <small v-if="item.codes.length" class="codes">{{ item.codes.join(" · ") }}</small>
                            <strong>{{ item.title }}</strong>
                            <span class="text">{{ item.tagline }}</span>
                            <span class="more">{{ t("products.viewProduct") }} <span aria-hidden="true">→</span></span>
                        </span>
                    </NuxtLink>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
/**
 * Product catalogue (/prodotti): one grid, filtered by the category bar and the search.
 * Content: CMS → Pagine → Prodotti (one child page per product).
 * Set on the Prodotti page in the CMS: which categories the bar shows and in
 * what order ("Ordine delle categorie") and the cards per row. The order of the
 * products is alphabetical by name (update 79). (Grouping into sections: removed, update 74.)
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const { t, te, locale } = useI18n();
const localePath = useLocalePath();
const { getPage, getPageBySlug } = useCms();
const route = useRoute();
const router = useRouter();

// Only used if the CMS sends no category list (older backend).
const CATEGORY_ORDER = ["lavoratori", "idrogeologico", "ambiente", "strutturale", "predittiva", "stradale", "lorawan", "master-slave", "edili"];

const TEXT: Record<string, Record<string, string>> = {
    it: { all: "Tutti", filterLabel: "Filtra per categoria", searchLabel: "Cerca un prodotto", placeholder: "Cerca per nome, codice o modello…", clear: "Cancella la ricerca", one: "1 prodotto", many: "{n} prodotti", noMatch: "Nessun prodotto corrisponde alla ricerca.", showAll: "Mostra tutti i prodotti", emptyCategory: "Nessun prodotto in questa categoria per ora." },
    en: { all: "All", filterLabel: "Filter by category", searchLabel: "Search for a product", placeholder: "Search by name, code or model…", clear: "Clear the search", one: "1 product", many: "{n} products", noMatch: "No product matches your search.", showAll: "Show all products", emptyCategory: "No products in this category yet." },
    fr: { all: "Tous", filterLabel: "Filtrer par catégorie", searchLabel: "Rechercher un produit", placeholder: "Rechercher par nom, code ou modèle…", clear: "Effacer la recherche", one: "1 produit", many: "{n} produits", noMatch: "Aucun produit ne correspond à la recherche.", showAll: "Afficher tous les produits", emptyCategory: "Aucun produit dans cette catégorie pour le moment." },
};
const L = computed(() => TEXT[locale.value] ?? TEXT.it!);

const { data: list } = await useAsyncData(
    () => `prodotti-list-${locale.value}`,
    () => getPage<any>("products.ProductPage", {}, { all: true }).catch(() => null),
    { watch: [locale] }
);

const { data: indexPage } = await useAsyncData(
    () => `prodotti-index-${locale.value}`,
    () => getPageBySlug<any>("products.ProductIndexPage", "prodotti").catch(() => null),
    { watch: [locale] }
);

const hasUntranslated = computed(() => ((list.value?.items ?? []) as any[]).some((p) => p.__fallback));

const lead = computed(() => {
    const intro = indexPage.value?.intro;
    return typeof intro === "string" && intro.trim() && !indexPage.value?.__fallback ? intro : t("products.lead");
});

const items = computed(() =>
    ((list.value?.items ?? []) as any[]).map((p) => ({
        slug: p.meta?.slug as string,
        title: p.title as string,
        // Main code + "Altri codici prodotto" (update 73); older backend: the one code.
        codes: (Array.isArray(p.product_codes) ? p.product_codes : [p.model_code]).filter(Boolean) as string[],
        models: ((p.available_models ?? []) as Array<{ value: string }>).map((b) => b?.value).filter(Boolean) as string[],
        tagline: p.tagline || "",
        category: p.category || "",
        categoryLabel: (p.category_label || "") as string,
        image: p.cover_image as { url: string; alt?: string } | null,
        // Card picture settings of this product (update 74): "" / null = the Prodotti page's.
        fit: (["cover", "contain"].includes(p.card_image?.fit) ? p.card_image.fit : "") as string,
        width: Number(p.card_image?.width) || 0,
        height: Number(p.card_image?.height) || 0,
    }))
    // Alphabetical by name (update 79), in the page's language: accents ignored,
    // numbers in order ("Sensore 2" before "Sensore 10").
    .sort((a, b) => a.title.localeCompare(b.title, locale.value, { sensitivity: "base", numeric: true }))
);

// Categories in the order set in the CMS, with their name in this language.
const cmsCategories = computed<Array<{ key: string; label: string }>>(() =>
    Array.isArray(indexPage.value?.categories) ? indexPage.value.categories : []
);
function labelOf(key: string): string {
    const fromCms = cmsCategories.value.find((c) => c.key === key)?.label;
    if (fromCms) return fromCms;
    const fromItem = items.value.find((i) => i.category === key)?.categoryLabel;
    if (fromItem) return fromItem;
    return key && te(`products.categories.${key}`) ? t(`products.categories.${key}`) : "";
}

type Display = { layout?: string; columns?: string; category_order?: string[]; image_height?: number | null; image_fit?: string };
const display = computed<Display>(() => (indexPage.value?.display as Display) || {});

// The bar (update 74):
// - the categories listed in "Ordine delle categorie" on the Prodotti page, in that
//   order, even before a product has been put in them (count 0);
// - then any other category that products use, so no product is ever unreachable;
// - nothing chosen there: every category that has products, in the standard order.
const categoryList = computed(() => {
    const valid = new Set(cmsCategories.value.length ? cmsCategories.value.map((c) => c.key) : CATEGORY_ORDER);
    const chosen = [...new Set((display.value.category_order || []).filter((k) => typeof k === "string" && valid.has(k)))];
    const standard = cmsCategories.value.length ? cmsCategories.value.map((c) => c.key) : CATEGORY_ORDER;
    const used = standard.filter((k) => !chosen.includes(k) && items.value.some((i) => i.category === k));
    return [...chosen, ...used]
        .map((key) => ({ key, label: labelOf(key), count: items.value.filter((i) => i.category === key).length }))
        .filter((c) => c.label);
});

const activeCategory = computed(() => {
    const q = String(route.query.categoria ?? "");
    return categoryList.value.some((c) => c.key === q) ? q : "";
});

function setCategory(key: string): void {
    const query = { ...route.query };
    if (key) query.categoria = key;
    else delete query.categoria;
    router.replace({ query });
}

// Search: as you type; written to the address after a short pause.
const query = ref(String(route.query.q ?? ""));
let urlTimer: ReturnType<typeof setTimeout> | undefined;
watch(query, (value) => {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => {
        const next = { ...route.query };
        if (value.trim()) next.q = value.trim();
        else delete next.q;
        router.replace({ query: next });
    }, 350);
});
watch(() => route.query.q, (q) => {
    const value = String(q ?? "");
    if (value !== query.value.trim()) query.value = value;
});
onBeforeUnmount(() => clearTimeout(urlTimer));

const normalize = (value: string): string =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("it").trim();

const isFiltering = computed(() => Boolean(activeCategory.value || query.value.trim()));

const filtered = computed(() => {
    const words = normalize(query.value).split(/\s+/).filter(Boolean);
    return items.value.filter((i) => {
        if (activeCategory.value && i.category !== activeCategory.value) return false;
        if (!words.length) return true;
        const text = normalize([i.title, i.tagline, ...i.codes, ...i.models, i.categoryLabel].join(" "));
        return words.every((w) => text.includes(w));
    });
});

const resultLabel = computed(() =>
    filtered.value.length === 1 ? L.value.one : L.value.many.replace("{n}", String(filtered.value.length))
);

function resetFilters(): void {
    query.value = "";
    const next = { ...route.query };
    delete next.categoria;
    delete next.q;
    router.replace({ query: next });
}

// Cards per row from the CMS ("Disposizione delle card").
const gridClass = computed(() => (["2", "3", "4"].includes(display.value.columns || "") ? `cols-${display.value.columns}` : ""));

// Card pictures (update 74), set in the CMS:
// - height of the picture space, in % of the card width (Prodotti page; empty = 190px);
// - fill the space or show the whole picture (Prodotti page, can be changed per product);
// - width and height of the picture inside its space, in % (per product; empty = 100).
//   Taller than the space: the top of the picture shows, the rest is cut off.
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const defaultFit = computed(() => (display.value.image_fit === "contain" ? "contain" : "cover"));
function mediaStyle(item: { fit: string; width: number; height: number }): Record<string, string> {
    const style: Record<string, string> = {};
    const height = Number(display.value.image_height) || 0;
    if (height) {
        style.height = "auto";
        style.aspectRatio = `100 / ${clamp(height, 30, 100)}`;
    }
    if (item.width) style["--img-w"] = `${clamp(item.width, 20, 300)}%`;
    if (item.height) style["--img-h"] = `${clamp(item.height, 20, 300)}%`;
    if (item.height > 100) style.alignItems = "start";
    style["--img-fit"] = item.fit || defaultFit.value;
    return style;
}

// One grid, products in alphabetical order (update 79); choosing categories
// no longer splits the page into sections; the bar does the filtering.
const visible = computed(() => (isFiltering.value ? filtered.value : items.value));

useSeoMeta({
    title: () => `${t("products.title")} | Axatel`,
    description: () => lead.value,
    ogTitle: () => `${t("products.title")} | Axatel`,
    ogDescription: () => lead.value,
    ogType: "website",
    robots: "index,follow",
});
</script>

<style scoped>
.prod-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.prod-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.prod-hero::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -6vh;
    left: 0;
    z-index: 2;
    height: 8vh;
    pointer-events: none;
    background: linear-gradient(180deg, #020712 0%, rgba(2, 7, 18, 0.76) 40%, rgba(2, 7, 18, 0) 100%);
}

.prod-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

/* Same width as Casi di successo (update 74): 1180px on large screens. */
.prod-shell {
    width: min(1180px, 90vw);
    margin: 0 auto;
    padding: 7vh 0 8vh;
}

.back-link {
    display: inline-block;
    margin-bottom: 18px;
    color: #c52317;
    text-decoration: none;
    font-weight: 700;
}

.page-kicker {
    padding-left: 14px;
    border-left: 4px solid #c52317;
    color: #c52317;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.lead {
    max-width: 720px;
    margin: 12px 0 12px;
    color: #274e72;
    font-size: 1.08rem;
    line-height: 1.62;
}

.empty {
    padding: 40px 0;
    color: #667f97;
}

/* Category bar + search (update 73) */
.prod-tools {
    margin: 28px 0 8px;
}

.cat-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 4px;
    padding-top: 30px; /* room for the count bubble above the first row */
}

.cat {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 0 14px;
    border: 1.5px solid transparent;
    background: transparent;
    color: #7c8fa2;
    font: inherit;
    font-size: 0.98rem;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease;
}

.cat:hover,
.cat:focus-visible {
    color: #0b355b;
}

.cat[aria-pressed="true"] {
    border-color: #c52317;
    color: #0b355b;
}

.cat:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: 2px;
}

/* Number of products: a small bubble above the name, on hover or keyboard focus. */
.cat .count {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    min-width: 26px;
    padding: 3px 8px;
    border-radius: 4px;
    background: #5f6b76;
    color: #fff;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.4;
    text-align: center;
    font-variant-numeric: tabular-nums;
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, 4px);
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.cat .count::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    border: 5px solid transparent;
    border-top-color: #5f6b76;
    transform: translateX(-50%);
}

.cat:hover .count,
.cat:focus-visible .count {
    opacity: 1;
    transform: translate(-50%, 0);
}

/* Touch screens have no hover: the number sits next to the name instead. */
@media (hover: none) {
    .cat-bar {
        padding-top: 0;
    }

    .cat .count {
        position: static;
        margin-left: 6px;
        padding: 1px 6px;
        background: rgba(11, 53, 91, 0.1);
        color: #4a6883;
        opacity: 1;
        transform: none;
    }

    .cat .count::after {
        display: none;
    }
}

.search {
    position: relative;
    max-width: 520px;
    margin-top: 16px;
}

.search input {
    width: 100%;
    min-height: 46px;
    padding: 0 42px 0 42px;
    border: 1px solid rgba(11, 53, 91, 0.28);
    border-radius: 0;
    background: rgba(255, 255, 255, 0.9);
    color: #0b355b;
    font: inherit;
    outline: none;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
}

.search input::-webkit-search-cancel-button {
    display: none;
}

.search input:focus {
    border-color: #c52317;
    box-shadow: 0 0 0 3px rgba(197, 35, 23, 0.1);
}

.search-icon {
    position: absolute;
    top: 50%;
    left: 14px;
    display: flex;
    color: #667f97;
    transform: translateY(-50%);
    pointer-events: none;
}

.search .clear {
    position: absolute;
    top: 50%;
    right: 6px;
    width: 34px;
    height: 34px;
    border: 0;
    background: transparent;
    color: #4a6883;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    transform: translateY(-50%);
}

.search .clear:hover,
.search .clear:focus-visible {
    color: #c52317;
}

.result-count {
    margin: 10px 0 0;
    color: #667f97;
    font-size: 0.86rem;
}

.no-match {
    padding: 34px 0 10px;
    color: #274e72;
}

.no-match p {
    margin: 0 0 14px;
}

.no-match button {
    padding: 10px 16px;
    border: 1px solid #c52317;
    background: transparent;
    color: #0b355b;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

/* Cards: same look as Casi di successo (update 74). */
.prod-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(max(260px, calc((100% - 36px) / 3)), 1fr));
    gap: 18px;
    margin-top: 28px;
}

/* Cards per row chosen in the CMS (update 58): at most 2 on tablets, 1 on phones. */
@media (min-width: 1024px) {
    .prod-grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .prod-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .prod-grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (min-width: 640px) and (max-width: 1023px) {
    .prod-grid.cols-2,
    .prod-grid.cols-3,
    .prod-grid.cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 639px) {
    .prod-grid,
    .prod-grid.cols-2,
    .prod-grid.cols-3,
    .prod-grid.cols-4 { grid-template-columns: minmax(0, 1fr); }
}

.prod-card {
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    border-radius: 0;
    background: rgba(255, 255, 255, 0.82);
    color: inherit;
    text-decoration: none;
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;
}

.prod-card:hover,
.prod-card:focus-visible {
    transform: translateY(-5px);
    border-color: rgba(197, 35, 23, 0.48);
    background: #fff;
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

.prod-card:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: 2px;
}

.media {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 190px; /* changed by "Altezza delle immagini nelle card" in the CMS */
    overflow: hidden;
    background: #eaf1f6;
}

.media::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #c52317 0 22%, rgba(197, 35, 23, 0.2) 22% 100%);
}

.media :deep(img) {
    width: var(--img-w, 100%);
    height: var(--img-h, 100%);
    max-width: none;
    flex: 0 0 auto;
    display: block;
    object-fit: var(--img-fit, cover);
    transition: transform 0.35s ease;
}

.prod-card:hover .media :deep(img) {
    transform: scale(1.04);
}

.placeholder {
    height: 100%;
    display: grid;
    place-items: center;
    padding: 18px;
    color: rgba(11, 53, 91, 0.35);
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-align: center;
}

.body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
}

.body .codes {
    color: #c52317;
    font-size: 0.9rem;
    font-weight: 700;
}

.body strong {
    color: #0b355b;
    font-size: 1.18rem;
    line-height: 1.22;
}

.text {
    flex: 1;
    color: #274e72;
    line-height: 1.5;
}

.more {
    color: #c52317;
    font-size: 0.86rem;
    font-weight: 700;
}

@media (max-width: 768px) {
    .prod-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .prod-shell {
        padding: 5vh 0 6vh;
    }
}
</style>