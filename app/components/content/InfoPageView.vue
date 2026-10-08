<template>
    <!-- An Azienda / Approfondimenti page from the CMS (Pagine → Azienda or
         Approfondimenti): "Pagina informativa" or "Glossario". -->
    <main class="info-page">
        <header class="info-hero">
            <ArticleParticleHero :title="page.title" :asset-url="headerWing()" />
        </header>

        <div class="info-light-stage">
            <article class="info-shell">
                <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

                <LayoutTranslationNotice v-if="page.__fallback" />

                <!-- "Immagine nella pagina" (Meta panel in the CMS): next to the
                     introduction, large at the top, or not shown. -->
                <ContentMetaCover
                    v-if="page.cover_image && position === 'top'"
                    :src="imageUrl(page.cover_image.url)"
                    :alt="page.cover_image.alt || page.title"
                    :width="page.cover_image.width"
                    :height="page.cover_image.height"
                />

                <div class="info-intro" :class="{ 'has-media': sideImage }">
                    <div>
                        <p v-if="kicker" class="info-kicker">{{ kicker }}</p>
                        <p v-if="page.introduction" class="lead">{{ page.introduction }}</p>
                        <ContentMetaTags :tags="tags" />
                    </div>
                    <figure v-if="sideImage" class="info-media">
                        <ContentResponsiveImage
                            :src="page.cover_image.url"
                            :alt="page.cover_image.alt || page.title"
                            :width="page.cover_image.width"
                            :height="page.cover_image.height"
                            sizes="100vw md:50vw lg:520px"
                            loading="eager"
                            fetchpriority="high"
                        />
                    </figure>
                </div>

                <GlossarySearch v-if="isGlossary" :terms="glossaryTerms" />

                <div v-else class="info-body">
                    <CmsBlockRenderer :blocks="page.body ?? []" />
                </div>

                <ContentProjectCta v-if="!endsWithCta && !isGlossary" :subject="page.title" />

                <nav v-if="siblings.length" class="related" :aria-label="t('info.sectionAria')">
                    <h2>{{ t("info.related") }}</h2>
                    <div class="related-grid">
                        <NuxtLink v-for="item in siblings" :key="item.slug" :to="localePath(item.path)">
                            <span>{{ sectionTitle }}</span>
                            <strong>{{ item.title }}</strong>
                        </NuxtLink>
                    </div>
                </nav>
            </article>
        </div>
    </main>
</template>

<script setup lang="ts">
/**
 * Renders a CMS "Pagina informativa" (eyebrow, introduction, picture,
 * blocks) or "Glossario" (searchable terms), plus links to the other
 * pages of the same section. Used by pages/[area]/[slug].vue.
 */
import { computed } from "vue";
import ArticleParticleHero from "../articles/ArticleParticleHero.vue";
import GlossarySearch from "./GlossarySearch.vue";
import { coverPosition, pageTags } from "../../utils/pageMeta";

const props = defineProps<{ page: any; area: string }>();

const { t, locale } = useI18n();
const localePath = useLocalePath();
const { imageUrl } = useCmsImage();
const { getChildren } = useCms();

const isGlossary = computed(() => props.page?.meta?.type === "home.GlossaryPage");
const sectionTitle = computed(() => props.page?.meta?.parent?.title || "");
// "Categoria" (Meta panel) replaces the section name in the label above the text.
const kicker = computed(() => [props.page?.category || sectionTitle.value, props.page?.eyebrow].filter(Boolean).join(" · "));
const position = computed(() => coverPosition(props.page));
const sideImage = computed(() => Boolean(props.page?.cover_image) && position.value === "side");
const tags = computed(() => pageTags(props.page));

const glossaryTerms = computed(() =>
    ((props.page?.terms ?? []) as Array<{ term: string; definition: string; aliases?: string[] }>)
        .slice()
        .sort((a, b) => a.term.localeCompare(b.term, locale.value))
);

// A CTA block at the end of the body already closes the page.
const endsWithCta = computed(() => {
    const body = (props.page?.body ?? []) as Array<{ type: string }>;
    return body.length > 0 && body[body.length - 1]!.type === "cta";
});

// The other pages of the section, in the language this page is shown in.
const parentId = computed<number | undefined>(() => props.page?.meta?.parent?.id);
const { data: children } = await useAsyncData(
    () => `info-siblings-${locale.value}-${parentId.value}`,
    () =>
        parentId.value
            ? getChildren(parentId.value, props.page?.__fallback ? "it" : locale.value).catch(() => null)
            : Promise.resolve(null),
    { watch: [parentId] }
);

const siblings = computed(() =>
    ((children.value?.items ?? []) as any[])
        .filter((p) => p.meta?.slug && p.meta.slug !== props.page?.meta?.slug)
        .slice(0, 4)
        .map((p) => ({ slug: p.meta.slug as string, title: p.title as string, path: `/${props.area}/${p.meta.slug}` }))
);
</script>

<style scoped>
.info-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.info-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.info-hero::after {
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

.info-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.info-shell {
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

.info-intro {
    display: grid;
    gap: 32px;
    align-items: center;
    margin: 0 0 12px;
    padding-bottom: 20px;
}

.info-intro.has-media {
    grid-template-columns: minmax(0, 1fr) minmax(220px, 340px);
}

.info-kicker {
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

.info-media {
    margin: 0;
    padding: 16px;
    border: 1px solid rgba(11, 53, 91, 0.1);
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 18px 40px rgba(17, 48, 78, 0.1);
}

.info-media img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 260px;
    object-fit: contain;
}

.info-body {
    --cms-text: #274e72;
    --cms-heading: #0b355b;
    --cms-border: rgba(11, 53, 91, 0.12);
    --cms-surface: #ffffff;
    --cms-measure: 100%;
    --cms-wide: 100%;
    color: #0b355b;
}

.info-body :deep(.cms-rich-text) {
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
    .info-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .info-intro.has-media {
        grid-template-columns: 1fr;
    }

    .info-media {
        max-width: 260px;
        order: -1;
    }
}
</style>
