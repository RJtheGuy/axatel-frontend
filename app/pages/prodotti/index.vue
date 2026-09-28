<template>
    <main class="prod-page">
        <header class="prod-hero">
            <ArticleParticleHero :title="t('products.title')" :asset-url="resolveImage('/immagini/ala.png')" />
        </header>

        <div class="prod-light-stage">
            <section class="prod-shell">
                <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

                <div class="page-kicker">{{ t("products.kicker") }}</div>
                <p class="lead">{{ lead }}</p>
                <LayoutTranslationNotice v-if="hasUntranslated" />

                <p v-if="!groups.length" class="empty">{{ t("products.empty") }}</p>

                <section v-for="group in groups" :key="group.key" class="prod-group" :aria-labelledby="`cat-${group.key}`">
                    <h2 :id="`cat-${group.key}`">{{ group.label }}</h2>
                    <div class="prod-grid">
                        <NuxtLink
                            v-for="item in group.items"
                            :key="item.slug"
                            :to="localePath(`/prodotti/${item.slug}`)"
                            class="prod-card"
                        >
                            <span class="media">
                                <img v-if="item.image" :src="item.image.url" :alt="item.image.alt || item.title" loading="lazy" decoding="async" />
                                <span v-else class="placeholder" aria-hidden="true">{{ item.title }}</span>
                            </span>
                            <span class="body">
                                <small v-if="item.model">{{ item.model }}</small>
                                <strong>{{ item.title }}</strong>
                                <span class="text">{{ item.tagline }}</span>
                                <span class="more">{{ t("products.viewProduct") }} <span aria-hidden="true">→</span></span>
                            </span>
                        </NuxtLink>
                    </div>
                </section>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
/**
 * Product catalogue (/prodotti), grouped by category.
 * Content: CMS → Pagine → Prodotti (one child page per product).
 */
import { computed } from "vue";
import { useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const { t, te, locale } = useI18n();
const localePath = useLocalePath();
const { getPage, getPageBySlug } = useCms();

const CATEGORY_ORDER = ["sistemi", "sensori", "piattaforme", "comunicazione"];

const { data: list } = await useAsyncData(
    () => `prodotti-list-${locale.value}`,
    () => getPage<any>("products.ProductPage", { limit: 20 }).catch(() => null),
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
        model: p.model_code || "",
        tagline: p.tagline || "",
        category: p.category || "",
        image: p.cover_image as { url: string; alt?: string } | null,
    }))
);

const groups = computed(() => {
    const keys = [...CATEGORY_ORDER, ...new Set(items.value.map((i) => i.category).filter((c) => !CATEGORY_ORDER.includes(c)))];
    return keys
        .map((key) => ({
            key: key || "altro",
            label: key && te(`products.categories.${key}`) ? t(`products.categories.${key}`) : t("products.title"),
            items: items.value.filter((i) => i.category === key),
        }))
        .filter((g) => g.items.length);
});

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

.prod-shell {
    max-width: 1180px;
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

.prod-group {
    margin-top: 36px;
}

.prod-group h2 {
    margin: 0 0 14px;
    color: #0b355b;
    font-size: 1.35rem;
    font-weight: 500;
}

.prod-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 18px;
}

.prod-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    border-radius: 16px;
    background: #fff;
    color: inherit;
    text-decoration: none;
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.prod-card:hover,
.prod-card:focus-visible {
    transform: translateY(-4px);
    border-color: rgba(197, 35, 23, 0.48);
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

.media {
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 10;
    padding: 18px;
    background: linear-gradient(160deg, #f1f6fb 0%, #e6eef6 100%);
}

.media img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.placeholder {
    color: rgba(11, 53, 91, 0.35);
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-align: center;
}

.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    padding: 20px 22px 22px;
}

.body small {
    color: #c52317;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.body strong {
    color: #0b355b;
    font-size: 1.14rem;
}

.text {
    flex: 1;
    color: #274e72;
    line-height: 1.5;
}

.more {
    margin-top: 8px;
    color: #c52317;
    font-size: 0.86rem;
    font-weight: 700;
}

@media (max-width: 768px) {
    .prod-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }
}
</style>
