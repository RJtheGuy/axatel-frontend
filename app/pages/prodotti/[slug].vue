<template>
    <main class="prod-page">
        <header class="prod-hero">
            <ArticleParticleHero :title="product.title" :asset-url="headerWing()" />
        </header>

        <div class="prod-light-stage">
            <article class="prod-shell">
                <NuxtLink :to="localePath('/prodotti')" class="back-link">← {{ t("products.back") }}</NuxtLink>

                <LayoutTranslationNotice v-if="product.__fallback" />

                <!-- "Immagine nella pagina" (CMS, update 73): large at the top, as on a
                     success story, or next to the description as before. -->
                <ContentMetaCover
                    v-if="product.show_intro !== false && product.cover_image && coverTop"
                    :src="product.cover_image.url"
                    :alt="product.cover_image.alt || product.title"
                    :width="product.cover_image.width"
                    :height="product.cover_image.height"
                />

                <!-- "Mostra la scheda in cima alla pagina" (CMS): off = only on the cards. -->
                <div v-if="product.show_intro !== false" class="prod-intro" :class="{ 'has-media': sideImage }">
                    <div>
                        <p class="prod-kicker">{{ categoryLabel }}</p>
                        <p v-if="codes.length" class="model">{{ codes.length > 1 ? L.codes : L.code }}: <strong>{{ codes.join(" · ") }}</strong></p>
                        <p v-if="product.tagline" class="lead">{{ product.tagline }}</p>
                        <!-- "Modelli disponibili" (update 73): only when filled in. -->
                        <div v-if="models.length" class="variants">
                            <p class="variants-title">{{ L.models }}</p>
                            <ul role="list">
                                <li v-for="m in models" :key="m">{{ m }}</li>
                            </ul>
                        </div>
                        <div class="actions">
                            <a
                                v-if="datasheet"
                                :href="datasheet"
                                class="btn-primary"
                                target="_blank"
                                rel="noopener noreferrer"
                            >{{ t("products.datasheet") }} <span aria-hidden="true">↓</span></a>
                            <NuxtLink :to="quoteLink" class="btn-secondary">{{ t("project.quote") }}</NuxtLink>
                        </div>
                    </div>
                    <figure v-if="sideImage" class="prod-media">
                        <ContentResponsiveImage
                            :src="product.cover_image.url"
                            :alt="product.cover_image.alt || product.title"
                            :width="product.cover_image.width"
                            :height="product.cover_image.height"
                            sizes="100vw md:50vw lg:520px"
                            loading="eager"
                            fetchpriority="high"
                        />
                    </figure>
                </div>

                <section v-if="specs.length" class="specs" aria-labelledby="specs-title">
                    <h2 id="specs-title">{{ t("products.specs") }}</h2>
                    <dl>
                        <div v-for="spec in specs" :key="spec.label + spec.value" class="spec-row">
                            <dt>{{ spec.label }}</dt>
                            <dd>{{ spec.value }}</dd>
                        </div>
                    </dl>
                </section>

                <div class="prod-body">
                    <CmsBlockRenderer :blocks="product.body ?? []" />
                </div>

                <ContentProjectCta :subject="product.title" />
            </article>
        </div>
    </main>
</template>

<script setup lang="ts">
/**
 * Product page (/prodotti/<slug>): picture, category, datasheet download,
 * specifications table, the page's CMS blocks (e.g. related case studies)
 * and a "request a quote" call to action.
 * Content: CMS → Pagine → Prodotti → <product>.
 */
import { computed } from "vue";
import { createError, useRoute, useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const route = useRoute();
const { t, te, locale } = useI18n();
const localePath = useLocalePath();
const { getPageBySlug } = useCms();

const slug = computed(() => {
    const s = route.params.slug;
    return (Array.isArray(s) ? s[0] : s) || "";
});

const { data: raw } = await useAsyncData(
    () => `prodotto-${locale.value}-${slug.value}`,
    () => getPageBySlug<any>("products.ProductPage", slug.value).catch(() => null),
    { watch: [slug, locale] }
);

if (!raw.value) {
    throw createError({ statusCode: 404, statusMessage: t("errors.product"), fatal: import.meta.client });
}

const product = computed(() => raw.value as any);

const TEXT: Record<string, { code: string; codes: string; models: string }> = {
    it: { code: "Codice", codes: "Codici", models: "Modelli disponibili" },
    en: { code: "Code", codes: "Codes", models: "Available models" },
    fr: { code: "Code", codes: "Codes", models: "Modèles disponibles" },
};
const L = computed(() => TEXT[locale.value] ?? TEXT.it!);

// Category name in this page's language (CMS); older backend: the site's own labels.
const categoryLabel = computed(() => {
    if (product.value.category_label) return product.value.category_label;
    const c = product.value.category;
    return c && te(`products.categories.${c}`) ? t(`products.categories.${c}`) : t("products.title");
});

// Main code + "Altri codici prodotto"; older backend: the one code.
const codes = computed<string[]>(() =>
    (Array.isArray(product.value.product_codes) ? product.value.product_codes : [product.value.model_code]).filter(Boolean)
);

const models = computed<string[]>(() =>
    ((product.value.available_models ?? []) as Array<{ value: string }>).map((b) => b?.value).filter(Boolean)
);

const coverTop = computed(() => product.value.cover_position === "top");
const sideImage = computed(() => Boolean(product.value.cover_image) && !coverTop.value);

// An uploaded PDF (Documenti) wins over the external link.
const datasheet = computed(() => product.value.datasheet?.url || product.value.datasheet_url || "");

const specs = computed(() =>
    ((product.value.specs ?? []) as Array<{ value: { label: string; value: string } }>)
        .map((b) => b.value)
        .filter((s) => s?.label && s?.value)
);

const quoteLink = computed(() => ({
    path: localePath("/contatti"),
    query: { tipo: "preventivo", oggetto: product.value.title },
}));

useSeoMeta({
    title: () => `${product.value.title} | Axatel`,
    description: () => product.value.meta?.search_description || product.value.tagline,
    ogTitle: () => product.value.title,
    ogDescription: () => product.value.tagline,
    ogImage: () => product.value.cover_image?.url,
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

.prod-shell {
    max-width: 1000px;
    margin: 0 auto;
    padding: 7vh 5vw 8vh;
}

.back-link {
    display: inline-block;
    margin-bottom: 18px;
    color: #c52317;
    text-decoration: none;
    font-weight: 700;
}

.prod-intro {
    display: grid;
    gap: 36px;
    align-items: center;
    padding-bottom: 36px;
    border-bottom: 1px solid rgba(11, 53, 91, 0.1);
}

.prod-intro.has-media {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 420px);
}

.prod-kicker {
    margin: 0 0 8px;
    color: #c52317;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.model {
    margin: 0 0 12px;
    color: #4a6883;
    font-size: 0.9rem;
}

.model strong {
    color: #0b355b;
    font-variant-numeric: tabular-nums;
}

.lead {
    max-width: 60ch;
    margin: 0;
    color: #274e72;
    font-size: 1.14rem;
    line-height: 1.62;
}

.variants {
    margin-top: 18px;
}

.variants-title {
    margin: 0 0 8px;
    color: #4a6883;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.variants ul {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.variants li {
    padding: 6px 12px;
    border: 1px solid rgba(11, 53, 91, 0.2);
    border-radius: 999px;
    background: #fff;
    color: #0b355b;
    font-size: 0.9rem;
    font-weight: 600;
}

.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
}

.actions a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 22px;
    border-radius: 999px;
    font-size: 0.86rem;
    font-weight: 650;
    text-decoration: none;
}

.btn-primary {
    color: #fff;
    background: #c52317;
}

.btn-primary:hover,
.btn-primary:focus-visible {
    background: #a51d13;
}

.btn-secondary {
    color: #0b355b;
    border: 1px solid rgba(11, 53, 91, 0.3);
}

.btn-secondary:hover,
.btn-secondary:focus-visible {
    border-color: #0b355b;
}

.prod-media {
    margin: 0;
    padding: 20px;
    border: 1px solid rgba(11, 53, 91, 0.1);
    border-radius: 18px;
    background: linear-gradient(160deg, #f1f6fb 0%, #ffffff 100%);
    box-shadow: 0 18px 40px rgba(17, 48, 78, 0.1);
}

.prod-media img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 320px;
    object-fit: contain;
}

.specs {
    margin: 36px 0 12px;
}

.specs h2 {
    margin: 0 0 14px;
    color: #0b355b;
    font-size: 1.3rem;
    font-weight: 500;
}

.specs dl {
    margin: 0;
    border: 1px solid rgba(11, 53, 91, 0.12);
    border-radius: 14px;
    overflow: hidden;
    background: #fff;
}

.spec-row {
    display: grid;
    grid-template-columns: minmax(140px, 240px) 1fr;
    gap: 16px;
    padding: 14px 20px;
}

.spec-row + .spec-row {
    border-top: 1px solid rgba(11, 53, 91, 0.08);
}

.spec-row dt {
    color: #4a6883;
    font-size: 0.86rem;
    font-weight: 650;
}

.spec-row dd {
    margin: 0;
    color: #0b355b;
    line-height: 1.5;
}

.prod-body {
    --cms-text: #274e72;
    --cms-heading: #0b355b;
    --cms-border: rgba(11, 53, 91, 0.12);
    --cms-surface: #ffffff;
    --cms-measure: 100%;
    --cms-wide: 100%;
    /* The site's own text colours, made dark for this light page, so the
       blocks drawn for the dark homepage (quote, numbers, card titles,
       headings) stay readable here too. Dark panels keep their own colours. */
    --ax-color-text-primary: #0b355b;
    --ax-color-text-secondary: #274e72;
    --ax-color-text-muted: #667f97;
    --ax-color-border-soft: rgba(11, 53, 91, 0.16);
    --ax-color-border-card: rgba(11, 53, 91, 0.22);
    --ax-color-bg-main: #f7fafc;
    color: #0b355b;
}

.prod-body :deep(.cms-rich-text) {
    max-width: none;
    padding: 0 0 8px;
}

@media (max-width: 768px) {
    .prod-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .prod-intro.has-media {
        grid-template-columns: 1fr;
    }

    .prod-media {
        order: -1;
    }

    .spec-row {
        grid-template-columns: 1fr;
        gap: 4px;
    }
}
</style>
