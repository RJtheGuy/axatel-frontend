<template>
    <main class="post-page">
        <header class="post-hero">
            <ArticleParticleHero
                :title="post.title"
                :asset-url="headerWing()"
            />
        </header>

        <div class="post-light-stage" :class="toneClass">
            <article class="post-shell">
                <NuxtLink :to="localePath('/news')" class="back-link">{{ t("blog.back") }}</NuxtLink>
                <LayoutTranslationNotice v-if="raw?.__fallback" />

                <div class="post-meta-top">
                    <span v-if="post.author">{{ post.author }}</span>
                    <span v-if="post.date">{{ formatDate(post.date) }}</span>
                </div>

                <p v-if="post.intro" class="lead">{{ post.intro }}</p>

                <div v-if="post.tags.length" class="post-tags">
                    <small v-for="tag in post.tags" :key="tag">{{ tag }}</small>
                </div>

                <figure v-if="post.image" class="post-media">
                    <ContentResponsiveImage
                        :src="post.image"
                        :alt="post.title"
                        :width="900"
                        :height="506"
                        sizes="100vw lg:900px"
                        loading="eager"
                        fetchpriority="high"
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
import { computed, onMounted } from "vue";
import { createError, useHead, useRoute, useRuntimeConfig, useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const route = useRoute();
const { getPage, getPageBySlug } = useCms();
const { t, locale } = useI18n();
const localePath = useLocalePath();

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

const { data: raw, error: postError } = await useAsyncData(
    () => `blog-post-${locale.value}-${slug.value}`,
    () => getPageBySlug<any>("blog.BlogPost", slug.value as string),
    { watch: [slug] }
);

if (!raw.value) {
    throw cmsPageError(postError.value, t("blog.notFound"));
}

// Light or dark background for every news article: Pagine → News →
// "Disposizione e colori" (update 62). Same request as the News list.
const { data: newsIndex } = await useAsyncData(() => `blog-index-${locale.value}`, () =>
    getPage<any>("blog.BlogIndexPage", { limit: 1 }).then((res) => res?.items?.[0] ?? null).catch(() => null)
);
const toneClass = computed(() => (newsIndex.value?.display?.tone_articles === "dark" ? "tone-dark" : "tone-light"));

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
        return new Date(iso).toLocaleDateString(locale.value, { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return iso;
    }
}

useSeoMeta({
    title: () => `${post.value.title} | Axatel`,
    description: () => post.value.meta?.search_description || post.value.intro,
    ogTitle: () => post.value.title,
    ogDescription: () => post.value.intro,
    ogImage: () => post.value.image || undefined,
    ogType: "article",
    articlePublishedTime: () => post.value.date || undefined,
    articleAuthor: () => (post.value.author ? [post.value.author] : undefined),
    robots: "index,follow"
});

// BlogPosting structured data: lets search engines show the article with
// its date, author and picture.
const siteUrl = String((useRuntimeConfig().public as any)?.i18n?.baseUrl || "").replace(/\/$/, "");
const LANGUAGE_TAGS: Record<string, string> = { it: "it-IT", en: "en-GB", fr: "fr-FR" };
useHead({
    script: [
        {
            type: "application/ld+json",
            innerHTML: computed(() =>
                JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BlogPosting",
                    headline: post.value.title,
                    description: post.value.meta?.search_description || post.value.intro || undefined,
                    image: post.value.image || undefined,
                    datePublished: post.value.date || raw.value?.meta?.first_published_at || undefined,
                    dateModified: raw.value?.meta?.last_published_at || undefined,
                    author: post.value.author
                        ? { "@type": "Person", name: post.value.author }
                        : { "@type": "Organization", name: "Axatel" },
                    publisher: { "@type": "Organization", name: "Axatel", url: "https://axatel.it" },
                    inLanguage: raw.value?.__fallback ? "it-IT" : LANGUAGE_TAGS[locale.value] || "it-IT",
                    mainEntityOfPage: siteUrl ? `${siteUrl}${route.path}` : undefined,
                    keywords: post.value.tags.length ? post.value.tags.join(", ") : undefined,
                })
            ),
        },
    ],
});

// Reading the post removes it from the "new posts" count in the menu.
const { markRead } = useBlogUpdates();
onMounted(() => {
    markRead(slug.value as string);
});
</script>

<style scoped>
/* Same visual language as blog/index.vue and casi's detail styling. */
.post-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.post-hero {
    flex-shrink: 0;
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
    flex: 1;
    color: var(--tone-text, #0b355b);
    background: var(--tone-stage,
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%));
}

.post-shell {
    max-width: 860px;
    margin: 0 auto;
    padding: 7vh 5vw 8vh;
}

.back-link {
    display: inline-block;
    margin-bottom: 18px;
    color: var(--tone-accent, #c52317);
    text-decoration: none;
    font-weight: 700;
}

.post-meta-top {
    display: flex;
    gap: 14px;
    color: var(--tone-muted, #667f97);
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 14px;
}

.lead {
    max-width: 720px;
    margin: 0 0 20px;
    color: var(--tone-body, #274e72);
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
    border: 1px solid var(--tone-chip-border, rgba(234, 63, 48, 0.28));
    border-radius: 999px;
    background: var(--tone-chip, rgba(234, 63, 48, 0.12));
    color: var(--tone-chip-text, #0b355b);
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
    --cms-text: var(--tone-body, #274e72);
    --cms-heading: var(--tone-text, #0b355b);
    color: var(--tone-text, #0b355b);
}

.post-body :deep(h2),
.post-body :deep(h3),
.post-body :deep(h4) {
    color: var(--tone-text, #0b355b);
}

.post-body :deep(p) {
    color: var(--tone-body, #274e72);
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