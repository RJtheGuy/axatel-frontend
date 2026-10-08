<template>
    <main class="sol-page">
        <header class="sol-hero">
            <ArticleParticleHero :title="t('solutions.title')" :asset-url="headerWing()" />
        </header>

        <div class="sol-light-stage">
            <section class="sol-shell">
                <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

                <div class="page-kicker">{{ t("solutions.kicker") }}</div>
                <p class="lead">{{ lead }}</p>
                <LayoutTranslationNotice v-if="hasUntranslated" />

                <p v-if="!groups.length" class="empty">{{ t("solutions.empty") }}</p>

                <section v-for="group in groups" :key="group.key" class="sol-group" :aria-labelledby="`group-${group.key}`">
                    <h2 :id="`group-${group.key}`" class="group-title">{{ group.label }}</h2>
                    <div class="sol-grid">
                        <article v-for="item in group.items" :key="item.slug" class="sol-card">
                            <NuxtLink :to="localePath(`/soluzioni/${item.slug}`)" class="sol-link">
                                <div v-if="item.image" class="card-media" aria-hidden="true">
                                    <ContentResponsiveImage :src="item.image" :width="400" :height="225" sizes="100vw sm:50vw lg:400px" />
                                </div>
                                <p v-if="item.kicker" class="sol-eyebrow">{{ item.kicker }}</p>
                                <!-- Hidden (still read by screen readers) when "Mostra titolo
                                     nella card" is off because the picture contains it. -->
                                <h3 :class="{ 'visually-hidden': !item.showTitle }">{{ item.title }}</h3>
                                <p>{{ item.description }}</p>
                            </NuxtLink>
                        </article>
                    </div>
                </section>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
/**
 * Soluzioni listing, grouped like the menu (Piattaforme, Sensori,
 * Tecnologie, Servizi). Shows the CMS pages (Pagine → Soluzioni); while
 * none are published it shows the built-in list from data/contentPages.ts.
 */
import { computed } from "vue";
import { useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";
import { contentAreas } from "../../data/contentPages";
import { showCardTitle } from "../../utils/pageMeta";

const { t, te, locale } = useI18n();
const localePath = useLocalePath();
const { getPage, getPageBySlug } = useCms();

type SolutionItem = {
    title: string; eyebrow: string; kicker: string; description: string; slug: string; group: string; image: string; showTitle: boolean;
};

const GROUP_ORDER = ["Piattaforme", "Sensori", "Tecnologie", "Servizi"];

const { data: solData } = await useAsyncData(
    () => `soluzioni-list-${locale.value}`,
    () => getPage("solutions.SolutionPage", { limit: 20 }).catch(() => null),
    { watch: [locale] }
);

const { data: indexPage } = await useAsyncData(
    () => `soluzioni-index-${locale.value}`,
    () => getPageBySlug("solutions.SolutionsIndexPage", "soluzioni").catch(() => null),
    { watch: [locale] }
);

const hasUntranslated = computed(() => ((solData.value?.items ?? []) as any[]).some((p) => p.__fallback));

const lead = computed(() => {
    const intro = indexPage.value?.intro;
    return typeof intro === "string" && intro.trim().length > 0 && !indexPage.value?.__fallback ? intro : t("solutions.lead");
});

const items = computed<SolutionItem[]>(() => {
    const cms = (solData.value?.items ?? []) as any[];
    if (cms.length) {
        return cms.map((p) => ({
            title: p.title,
            eyebrow: p.eyebrow || "",
            // "Categoria" (Meta panel) before the short subtitle.
            kicker: [p.category, p.eyebrow].filter(Boolean).join(" · "),
            description: p.short_description || "",
            slug: p.meta?.slug,
            group: p.group || "",
            image: p.cover_image?.url || "",
            showTitle: showCardTitle(p, Boolean(p.cover_image?.url)),
        }));
    }
    const area = contentAreas.soluzioni;
    return area.order.map((slug) => area.pages[slug]!).map((p) => ({
        title: p.title, eyebrow: p.eyebrow, kicker: p.eyebrow, description: p.introduction, slug: p.slug, group: p.group,
        // Built-in pages: text cards as before.
        image: "", showTitle: true,
    }));
});

const groups = computed(() => {
    const keys = [...GROUP_ORDER, ...new Set(items.value.map((i) => i.group).filter((g) => !GROUP_ORDER.includes(g)))];
    return keys
        .map((key) => ({
            key: key || "altro",
            label: key && te(`solutions.groups.${key}`) ? t(`solutions.groups.${key}`) : key || t("solutions.title"),
            items: items.value.filter((i) => i.group === key),
        }))
        .filter((g) => g.items.length);
});

useSeoMeta({
    title: () => `${t("solutions.title")} | Axatel`,
    description: () => lead.value,
    ogTitle: () => `${t("solutions.title")} | Axatel`,
    ogDescription: () => lead.value,
    ogType: "website",
    robots: "index,follow"
});
</script>

<style scoped>
.sol-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.sol-hero {
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.sol-hero::after {
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

.sol-light-stage {
    flex: 1;
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.sol-shell {
    max-width: 1180px;
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
    margin: 12px 0 28px;
    color: #274e72;
    font-size: 1.08rem;
    line-height: 1.62;
}

.empty {
    color: #667f97;
    padding: 40px 0;
}

.sol-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 18px;
}

.sol-card {
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;
}

.sol-link {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 26px;
    height: 100%;
    color: inherit;
    text-decoration: none;
}

/* "Immagine di copertina" (Meta panel): whole picture, never cropped, so a
   title written inside it stays readable. */
.card-media {
    display: grid;
    place-items: center;
    aspect-ratio: 16 / 9;
    margin: -26px -26px 6px;
    padding: 14px;
    border-bottom: 1px solid rgba(11, 53, 91, 0.08);
    background: #ffffff;
}

.card-media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.sol-icon {
    font-size: 2rem;
    line-height: 1;
}

.sol-group {
    margin-top: 36px;
}

.group-title {
    margin: 0 0 14px;
    color: #0b355b;
    font-size: 1.35rem;
    font-weight: 500;
}

.sol-eyebrow {
    color: #c52317 !important;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.sol-link h3 {
    margin: 0;
    color: #0b355b;
    font-size: 1.14rem;
}

.sol-link p {
    margin: 0;
    color: #274e72;
    line-height: 1.5;
}

.sol-card:hover {
    transform: translateY(-5px);
    border-color: rgba(197, 35, 23, 0.48);
    background: #ffffff;
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

@media (max-width: 768px) {
    .sol-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .sol-shell {
        padding: 5vh 5vw 6vh;
    }
}
</style>