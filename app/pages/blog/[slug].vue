<template>
    <main class="post-page">
        <header class="post-hero">
            <ArticleParticleHero :title="post.title" :asset-url="resolveImage('/immagini/ala.png')" />
        </header>

        <div class="post-light-stage">
            <article class="post-shell">
                <NuxtLink to="/blog" class="back-link">Torna al blog</NuxtLink>

                <div class="post-meta-top">
                    <span v-if="post.author">{{ post.author }}</span>
                    <span v-if="post.date">{{ formatDate(post.date) }}</span>
                </div>

                <p v-if="post.intro" class="lead">{{ post.intro }}</p>

                <div v-if="post.tags.length" class="post-tags">
                    <small v-for="tag in post.tags" :key="tag">{{ tag }}</small>
                </div>

                <figure v-if="post.image" class="post-media">
                    <img
                        :src="imageUrl(post.image)"
                        :alt="post.title"
                        width="900"
                        height="506"
                        fetchpriority="high"
                        decoding="async"
                    />
                </figure>

                <!-- BlogPost.body is a real StreamField(BODY_BLOCKS) —
                     same rendering path as a Servizio page, NOT the
                     plain v-html casi/[slug].vue uses for its
                     RichTextField body. CmsBlockRenderer is auto-
                     imported by Nuxt, no import statement needed. -->
                <div class="post-body">
                    <CmsBlockRenderer :blocks="post.body ?? []" />
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

type BlogPostData = {
    title: string;
    author: string;
    date: string;
    intro: string;
    image: string;
    tags: string[];
    body: Array<{ type: string; value: any; id: string }>;
    meta?: { search_description?: string };
};

const slug = computed(() => {
    const s = route.params.slug;
    return Array.isArray(s) ? s[0] : s;
});

const { data: raw } = await useAsyncData(
    () => `blog-post-${slug.value}`,
    () => getPageBySlug<any>("blog.BlogPost", slug.value as string).catch(() => null),
    { watch: [slug] }
);

if (!raw.value) {
    throw createError({ statusCode: 404, statusMessage: "Articolo non trovato" });
}

const post = computed<BlogPostData>(() => ({
    title: raw.value.title,
    author: raw.value.author || "",
    date: raw.value.date || "",
    intro: raw.value.intro || "",
    image: raw.value.cover_image?.url || "",
    tags: raw.value.tags || [],
    body: raw.value.body || [],
    meta: raw.value.meta
}));

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return iso;
    }
}

useSeoMeta({
    title: () => `${post.value.title} | Axatel`,
    description: () => post.value.meta?.search_description || post.value.intro,
    ogTitle: () => post.value.title,
    ogDescription: () => post.value.intro,
    ogType: "article",
    robots: "index,follow"
});
</script>

<style scoped>
/* Same visual language as blog/index.vue and casi's detail styling. */
.post-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.post-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.post-hero::after {
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

.post-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.post-shell {
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

.post-meta-top {
    display: flex;
    gap: 14px;
    color: #667f97;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 14px;
}

.lead {
    max-width: 720px;
    margin: 0 0 20px;
    color: #274e72;
    font-size: 1.12rem;
    line-height: 1.62;
}

.post-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 28px;
}

.post-tags small {
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    background: rgba(234, 63, 48, 0.12);
    color: #0b355b;
    padding: 5px 10px;
    font-weight: 700;
}

.post-media {
    margin: 0 0 32px;
    overflow: hidden;
    border-radius: 4px;
}

.post-media img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: cover;
}

/* CmsBlockRenderer's child components already carry their own
   spacing/typography — this wrapper just resets the dark-theme
   defaults those components assume (they're normally used on the
   near-black homepage) to fit this page's light stage. */
.post-body {
    color: #0b355b;
}

.post-body :deep(h2),
.post-body :deep(h3),
.post-body :deep(h4) {
    color: #0b355b;
}

.post-body :deep(p) {
    color: #274e72;
}

@media (max-width: 768px) {
    .post-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .post-shell {
        padding: 5vh 5vw 6vh;
    }
}
</style>