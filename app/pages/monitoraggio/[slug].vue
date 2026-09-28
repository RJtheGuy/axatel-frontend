<template>
    <main class="topic-page">
        <header class="topic-hero">
            <ArticleParticleHero :title="topic.title" :asset-url="resolveImage('/immagini/ala.png')" />
        </header>

        <div class="topic-light-stage">
            <article class="topic-shell">
                <NuxtLink :to="localePath('/monitoraggio')" class="back-link">{{ t("monitoring.back") }}</NuxtLink>

                <LayoutTranslationNotice v-if="raw?.__fallback" />

                <div class="topic-intro" :class="{ 'has-media': topic.image }">
                    <div>
                        <p v-if="topic.category" class="topic-kicker">{{ topic.category }}</p>
                        <p v-if="topic.description" class="lead">{{ topic.description }}</p>
                    </div>
                    <figure v-if="topic.image" class="topic-badge">
                        <img
                            :src="imageUrl(topic.image)"
                            :alt="topic.image_alt || topic.title"
                            :width="topic.image_width"
                            :height="topic.image_height"
                            decoding="async"
                        />
                    </figure>
                </div>

                <!-- MonitoringPage.body is a real StreamField(BODY_BLOCKS) —
                     same rendering path as Servizio/Blog, not plain v-html. -->
                <div class="topic-body">
                    <CmsBlockRenderer :blocks="topic.body ?? []" />
                </div>
            </article>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { createError, useRoute, useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const route = useRoute();
const { getPageBySlug } = useCms();
const { imageUrl } = useCmsImage();

type TopicData = {
    title: string;
    icon: string;
    category: string;
    description: string;
    image: string;
    image_alt: string;
    image_width?: number;
    image_height?: number;
    body: Array<{ type: string; value: any; id: string }>;
    meta?: { search_description?: string };
};

const slug = computed(() => {
    const s = route.params.slug;
    return Array.isArray(s) ? s[0] : s;
});

const { t, locale } = useI18n();
const localePath = useLocalePath();

const { data: raw } = await useAsyncData(
    () => `monitoraggio-topic-${locale.value}-${slug.value}`,
    () => getPageBySlug<any>("monitoring.MonitoringPage", slug.value as string).catch(() => null),
    { watch: [slug, locale] }
);

if (!raw.value) {
    throw createError({ statusCode: 404, statusMessage: t("errors.topic") });
}

const topic = computed<TopicData>(() => ({
    title: raw.value.title,
    icon: raw.value.icon || "",
    category: raw.value.category || "",
    description: raw.value.short_description || "",
    image: raw.value.cover_image?.url || "",
    image_alt: raw.value.cover_image?.alt || "",
    image_width: raw.value.cover_image?.width,
    image_height: raw.value.cover_image?.height,
    body: raw.value.body || [],
    meta: raw.value.meta
}));

useSeoMeta({
    title: () => `${topic.value.title} | Axatel`,
    description: () => topic.value.meta?.search_description || topic.value.description,
    ogTitle: () => topic.value.title,
    ogDescription: () => topic.value.description,
    ogType: "article",
    robots: "index,follow"
});
</script>

<style scoped>
.topic-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.topic-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.topic-hero::after {
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

.topic-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.topic-shell {
    max-width: 860px;
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

.lead {
    max-width: 720px;
    margin: 0 0 28px;
    color: #274e72;
    font-size: 1.12rem;
    line-height: 1.62;
}

.topic-intro {
    display: grid;
    gap: 32px;
    align-items: center;
    margin: 0 0 40px;
    padding-bottom: 36px;
    border-bottom: 1px solid rgba(11, 53, 91, 0.1);
}

.topic-intro.has-media {
    grid-template-columns: minmax(0, 1fr) 220px;
}

.topic-intro .lead {
    margin: 0;
}

.topic-kicker {
    margin: 0 0 10px;
    color: #c52317;
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

/* Product pictogram (Angel River, Traffic Alert…): shown whole, never cropped. */
.topic-badge {
    margin: 0;
    padding: 22px;
    border: 1px solid rgba(11, 53, 91, 0.1);
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 18px 40px rgba(17, 48, 78, 0.1);
}

.topic-badge img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    object-fit: contain;
}

/* Rich text blocks carry their own page padding; inside this column they
   should line up with the intro instead of being indented again. */
.topic-body :deep(.cms-rich-text) {
    max-width: none;
    padding: 0 0 8px;
}

.topic-body {
    --cms-text: #274e72;
    --cms-heading: #0b355b;
    color: #0b355b;
}

.topic-body :deep(h2),
.topic-body :deep(h3),
.topic-body :deep(h4) {
    color: #0b355b;
}

.topic-body :deep(p) {
    color: #274e72;
}

@media (max-width: 768px) {
    .topic-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .topic-shell {
        padding: 5vh 5vw 6vh;
    }

    .topic-intro.has-media {
        grid-template-columns: 1fr;
    }

    .topic-badge {
        width: 160px;
        order: -1;
    }
}
</style>