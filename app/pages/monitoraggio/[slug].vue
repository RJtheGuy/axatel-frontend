<template>
    <main class="topic-page">
        <header class="topic-hero">
            <ArticleParticleHero
                :title="topic.title"
                :asset-url="topic.titleParticleImage || undefined"
            />
        </header>

        <div class="topic-light-stage">
            <article class="topic-shell">
                <NuxtLink to="/monitoraggio" class="back-link">Torna a Cosa monitoriamo</NuxtLink>

                <p v-if="topic.description" class="lead">{{ topic.description }}</p>

                <img
                    v-if="topic.image"
                    class="topic-cover"
                    :src="imageUrl(topic.image)"
                    :alt="topic.image_alt || topic.title"
                    :width="topic.image_width"
                    :height="topic.image_height"
                    decoding="async"
                />

                <!-- MonitoringPage.body is a real StreamField(BODY_BLOCKS) —
                     same rendering path as Servizio/Blog, not plain v-html. -->
                <div class="topic-body">
                    <template v-if="fallbackPage">
                        <section v-if="fallbackPage.feature">
                            <h2>{{ fallbackPage.feature.name }}</h2>
                            <p>{{ fallbackPage.feature.description }}</p>
                            <a v-if="fallbackPage.feature.href" :href="fallbackPage.feature.href">
                                {{ fallbackPage.feature.hrefLabel }}
                            </a>
                        </section>
                        <section v-for="section in fallbackPage.sections" :key="section.title">
                            <h2>{{ section.title }}</h2>
                            <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
                            <ul v-if="section.highlights?.length">
                                <li v-for="highlight in section.highlights" :key="highlight">{{ highlight }}</li>
                            </ul>
                        </section>
                        <p v-if="fallbackPage.cta">
                            {{ fallbackPage.cta.text }}
                            <NuxtLink :to="fallbackPage.cta.href">{{ fallbackPage.cta.label }}</NuxtLink>
                        </p>
                    </template>
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
import { monitoringPages } from "../../data/monitoring";

const route = useRoute();
const { getPageBySlug } = useCms();
const { imageUrl } = useCmsImage();

type TopicData = {
    title: string;
    icon: string;
    description: string;
    image: string;
    image_alt: string;
    image_width?: number;
    image_height?: number;
    titleParticleImage: string;
    body: Array<{ type: string; value: any; id: string }>;
    meta?: { search_description?: string };
};

const slug = computed(() => {
    const s = route.params.slug;
    return Array.isArray(s) ? s[0] : s;
});

const { data: raw, error: topicError } = await useAsyncData(
    () => `monitoraggio-topic-${slug.value}`,
    () => getPageBySlug<any>("monitoring.MonitoringPage", slug.value as string),
    { watch: [slug] }
);

const fallbackPage = computed(() => topicError.value ? monitoringPages[String(slug.value)] : undefined);

if (!raw.value && !fallbackPage.value) {
    throw createError({
        statusCode: topicError.value ? 503 : 404,
        statusMessage: topicError.value ? "CMS temporaneamente non disponibile" : "Argomento non trovato"
    });
}

const topic = computed<TopicData>(() => fallbackPage.value ? {
    title: fallbackPage.value.title,
    icon: "",
    description: fallbackPage.value.introduction,
    image: fallbackPage.value.image || "",
    image_alt: fallbackPage.value.imageAlt || "",
    titleParticleImage: "",
    body: []
} : ({
    title: raw.value.title,
    icon: raw.value.icon || "",
    description: raw.value.short_description || "",
    image: raw.value.cover_image?.url || "",
    image_alt: raw.value.cover_image?.alt || "",
    image_width: raw.value.cover_image?.width,
    image_height: raw.value.cover_image?.height,
    titleParticleImage: imageUrl(raw.value.title_particle_image),
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
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.topic-hero {
    flex-shrink: 0;
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
    flex: 1;
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

.topic-cover {
    width: 100%;
    max-height: 460px;
    display: block;
    margin: 0 0 32px;
    border: 1px solid rgba(11, 53, 91, 0.14);
    object-fit: cover;
}

.topic-body {
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
}
</style>