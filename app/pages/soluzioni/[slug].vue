<template>
    <!-- CMS page (Pagine → Soluzioni). If the page isn't in the CMS yet,
         the built-in version from data/contentPages.ts is shown instead. -->
    <main v-if="cms" class="sol-page">
        <header class="sol-hero">
            <ArticleParticleHero :title="cms.title" :asset-url="headerWing()" />
        </header>

        <div class="sol-light-stage">
            <article class="sol-shell">
                <NuxtLink :to="localePath('/soluzioni')" class="back-link">← {{ t("solutions.back") }}</NuxtLink>

                <LayoutTranslationNotice v-if="cms.__fallback" />

                <!-- "Immagine nella pagina" (Meta panel in the CMS): next to the
                     introduction, large at the top, or only on the card. -->
                <ContentMetaCover
                    v-if="cms.cover_image && position === 'top'"
                    :src="imageUrl(cms.cover_image.url)"
                    :alt="cms.cover_image.alt || cms.title"
                    :width="cms.cover_image.width"
                    :height="cms.cover_image.height"
                />

                <div class="sol-intro" :class="{ 'has-media': sideImage }">
                    <div>
                        <p v-if="kicker" class="sol-kicker">{{ kicker }}</p>
                        <p v-if="cms.short_description" class="lead">{{ cms.short_description }}</p>
                        <ContentMetaTags :tags="tags" />
                    </div>
                    <figure v-if="sideImage" class="sol-badge">
                        <ContentResponsiveImage
                            :src="cms.cover_image.url"
                            :alt="cms.cover_image.alt || cms.title"
                            :width="cms.cover_image.width"
                            :height="cms.cover_image.height"
                            sizes="100vw md:50vw lg:520px"
                            loading="eager"
                            fetchpriority="high"
                        />
                    </figure>
                </div>

                <div class="sol-body">
                    <CmsBlockRenderer :blocks="blocks" />
                </div>

                <ContentProcessSteps />

                <nav v-if="related.length" class="related" :aria-label="t('solutions.related')">
                    <h2>{{ t("solutions.related") }}</h2>
                    <div class="related-grid">
                        <NuxtLink v-for="item in related" :key="item.slug" :to="localePath(`/soluzioni/${item.slug}`)">
                            <span>{{ groupLabel(item.group) }}</span>
                            <strong>{{ item.title }}</strong>
                        </NuxtLink>
                    </div>
                </nav>

                <ContentProjectCta :subject="cms.title" />
            </article>
        </div>
    </main>

    <ContentPage
        v-else
        :page="legacy!"
        :breadcrumb-label="area.label"
        :base-path="area.basePath"
        :related-pages="legacyRelated"
        :related-label="`Altre pagine: ${area.label}`"
        :glossary-terms="[]"
    />
</template>

<script setup lang="ts">
/**
 * Soluzione detail page (/soluzioni/<slug>).
 *
 * Layout (Move Solutions style): intro + picture, the page's CMS blocks
 * (featured product, text sections, what we measure, device cards…),
 * "how we work" steps, other solutions in the same group, and a closing
 * "request a quote" call to action.
 */
import { computed } from "vue";
import { createError, useRoute, useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";
import ContentPage from "../../components/content/ContentPage.vue";
import { contentAreas } from "../../data/contentPages";
import { coverPosition, pageTags } from "../../utils/pageMeta";

const route = useRoute();
const { t, te, locale } = useI18n();
const localePath = useLocalePath();
const { getPage, getPageBySlug } = useCms();
const { imageUrl } = useCmsImage();

const slug = computed(() => {
    const s = route.params.slug;
    return (Array.isArray(s) ? s[0] : s) || "";
});

const { data: cms } = await useAsyncData(
    () => `soluzione-${locale.value}-${slug.value}`,
    () => getPageBySlug<any>("solutions.SolutionPage", slug.value).catch(() => null),
    { watch: [slug, locale] }
);

const { data: list } = await useAsyncData(
    () => `soluzioni-related-${locale.value}`,
    () => getPage<any>("solutions.SolutionPage", { limit: 20 }).catch(() => null),
    { watch: [locale] }
);

// Built-in fallback (the pages written in the code before the CMS).
const area = contentAreas.soluzioni;
const legacy = computed(() => area.pages[slug.value]);
const legacyRelated = computed(() =>
    area.order.filter((s) => s !== slug.value).slice(0, 4).map((s) => area.pages[s]!)
);

if (!cms.value && !legacy.value) {
    throw createError({ statusCode: 404, statusMessage: area.notFoundMessage, fatal: import.meta.client });
}

const groupLabel = (group?: string) =>
    group && te(`solutions.groups.${group}`) ? t(`solutions.groups.${group}`) : group || "";

// "Categoria" (Meta panel) replaces the menu group in the label above the text.
const kicker = computed(() =>
    [cms.value?.category || groupLabel(cms.value?.group), cms.value?.eyebrow].filter(Boolean).join(" · ")
);
const position = computed(() => coverPosition(cms.value));
const sideImage = computed(() => Boolean(cms.value?.cover_image) && position.value === "side");
const tags = computed(() => pageTags(cms.value));

// A CTA block at the end of the body would repeat the closing call to
// action, so it's left out here (it still shows on other page types).
const blocks = computed(() => {
    const body = (cms.value?.body ?? []) as Array<{ type: string }>;
    return body.length && body[body.length - 1]!.type === "cta" ? body.slice(0, -1) : body;
});

const related = computed(() => {
    const items = ((list.value?.items ?? []) as any[])
        .filter((p) => p.meta?.slug && p.meta.slug !== slug.value)
        .map((p) => ({ slug: p.meta.slug, title: p.title, group: p.group || "" }));
    const same = items.filter((p) => p.group && p.group === cms.value?.group);
    return (same.length >= 2 ? same : [...same, ...items.filter((p) => !same.includes(p))]).slice(0, 4);
});

useSeoMeta({
    title: () => `${cms.value?.title ?? legacy.value?.title ?? ""} | Axatel`,
    description: () => cms.value?.meta?.search_description || cms.value?.short_description || legacy.value?.introduction,
    ogTitle: () => cms.value?.title ?? legacy.value?.title,
    ogType: "article",
    robots: "index,follow",
});
</script>

<style scoped>
.sol-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.sol-hero {
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
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.sol-shell {
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

.sol-intro {
    display: grid;
    gap: 32px;
    align-items: center;
    margin: 0 0 12px;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(11, 53, 91, 0.1);
}

.sol-intro.has-media {
    grid-template-columns: minmax(0, 1fr) 260px;
}

.sol-kicker {
    margin: 0 0 10px;
    color: #c52317;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.lead {
    max-width: 720px;
    margin: 0;
    color: #274e72;
    font-size: 1.14rem;
    line-height: 1.62;
}

.sol-badge {
    margin: 0;
    padding: 20px;
    border: 1px solid rgba(11, 53, 91, 0.1);
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 18px 40px rgba(17, 48, 78, 0.1);
}

.sol-badge img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: contain;
}

.sol-body {
    --cms-text: #274e72;
    --cms-heading: #0b355b;
    --cms-border: rgba(11, 53, 91, 0.12);
    --cms-surface: #ffffff;
    --cms-measure: 100%;
    --cms-wide: 100%;
    color: #0b355b;
}

.sol-body :deep(.cms-rich-text) {
    max-width: none;
    padding: 0 0 8px;
}

.related {
    margin-top: 44px;
}

.related h2 {
    margin: 0 0 16px;
    color: #0b355b;
    font-size: 1.3rem;
    font-weight: 500;
}

.related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
}

.related-grid a {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 18px 20px;
    border: 1px solid rgba(11, 53, 91, 0.12);
    border-radius: 14px;
    background: #fff;
    color: #0b355b;
    text-decoration: none;
    transition: border-color 0.15s ease, transform 0.15s ease;
}

.related-grid a:hover,
.related-grid a:focus-visible {
    border-color: #c52317;
    transform: translateY(-2px);
}

.related-grid span {
    color: #c52317;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

@media (max-width: 768px) {
    .sol-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .sol-intro.has-media {
        grid-template-columns: 1fr;
    }

    .sol-badge {
        max-width: 220px;
        order: -1;
    }
}
</style>
