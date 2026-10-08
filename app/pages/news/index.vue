<template>
    <main class="blog-page">
        <header class="blog-hero">
            <ArticleParticleHero :title="t('blog.title')" :asset-url="headerWing()" />
        </header>

        <div class="blog-light-stage">
            <section class="blog-shell">
                <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

                <div class="page-kicker">{{ t("blog.title") }}</div>
                <p class="lead">{{ lead }}</p>

                <p v-if="blogError" class="empty" role="alert">{{ t("errors.unavailable") }}</p>
                <!-- No article yet: a "coming soon" panel instead of an empty
                     page. Title and text: Pagine → News → "Quando non ci
                     sono news" (empty = the built-in text, translated). -->
                <section v-else-if="!posts.length" class="news-empty" aria-labelledby="news-empty-title">
                    <div class="news-empty-glow" aria-hidden="true"></div>
                    <img :src="headerWing()" alt="" class="news-empty-wings" width="180" height="164" decoding="async" />
                    <span class="news-empty-kicker"><span class="news-empty-dot" aria-hidden="true"></span>{{ t("blog.emptyKicker") }}</span>
                    <h2 id="news-empty-title">{{ emptyTitle }}</h2>
                    <p>{{ emptyText }}</p>
                    <div class="news-empty-actions">
                        <NuxtLink :to="localePath('/casi')" class="news-empty-btn is-primary">{{ t("blog.emptyCases") }} <span aria-hidden="true">→</span></NuxtLink>
                        <NuxtLink :to="localePath('/contatti')" class="news-empty-btn is-ghost">{{ t("blog.emptyContact") }}</NuxtLink>
                    </div>
                </section>

                <div v-else class="blog-grid">
                    <article v-for="(item, index) in posts" :key="item.slug" class="post-card">
                        <NuxtLink :to="localePath(`/news/${item.slug}`)" class="post-link" :aria-label="t('blog.read', { title: item.title })">
                            <div class="post-media">
                                <ContentResponsiveImage
                                    v-if="item.image"
                                    :src="item.image"
                                    :alt="item.title"
                                    :width="400"
                                    :height="225"
                                    sizes="100vw sm:50vw lg:400px"
                                    :loading="index < 3 ? 'eager' : 'lazy'"
                                    :fetchpriority="index === 0 ? 'high' : 'auto'"
                                />
                                <div v-else class="post-placeholder">{{ item.title }}</div>
                            </div>

                            <div class="post-content">
                                <div class="post-meta-top">
                                    <span v-if="item.author">{{ item.author }}</span>
                                    <span v-if="item.date">{{ formatDate(item.date) }}</span>
                                </div>
                                <h2>{{ item.title }}</h2>
                                <p>{{ item.intro }}</p>

                                <div v-if="item.tags.length" class="post-tags">
                                    <small v-for="tag in item.tags" :key="tag">{{ tag }}</small>
                                </div>
                            </div>
                        </NuxtLink>
                    </article>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const { getPage, getPageBySlug } = useCms();
const { t, locale } = useI18n();
const localePath = useLocalePath();

type PostItem = {
    title: string;
    author: string;
    date: string;
    image: string;
    intro: string;
    tags: string[];
    slug: string;
};

const { data: blogData, error: blogError } = await useAsyncData(() => `blog-list-${locale.value}`, () =>
    getPage("blog.BlogPost", { order: "-date", limit: 20 })
);

// Intro copy comes from BlogIndexPage.intro, editable in the admin —
// same convention as casi/index.vue's CasiIndexPage.intro.
const { data: indexPage } = await useAsyncData(() => `blog-index-${locale.value}`, () =>
    getPage<any>("blog.BlogIndexPage", { limit: 1 }).then((res) => res?.items?.[0] ?? null).catch(() => null)
);


const lead = computed(() => {
    const intro = indexPage.value?.intro;
    // intro is a StreamField (BODY_BLOCKS), not plain text — if it's
    // ever populated with real blocks, prefer rendering it with
    // CmsBlockRenderer instead of this plain-text fallback. Left as a
    // simple default for now since BlogIndexPage.intro is very likely
    // still empty on a fresh install.
    // An untranslated index page would put Italian text on the EN/FR site.
    if (indexPage.value?.__fallback) return t("blog.lead");
    return typeof intro === "string" && intro.trim().length > 0 ? intro : t("blog.lead");
});

// "Quando non ci sono news" on the News index page, else the built-in text.
const fromIndex = (field: "empty_title" | "empty_text") =>
    (!indexPage.value?.__fallback && String(indexPage.value?.[field] || "").trim()) || "";
const emptyTitle = computed(() => fromIndex("empty_title") || t("blog.emptyTitle"));
const emptyText = computed(() => fromIndex("empty_text") || t("blog.emptyText"));

const posts = computed<PostItem[]>(() =>
    (blogData.value?.items ?? []).map((p: any) => ({
        title: p.title,
        author: p.author || "",
        date: p.date || "",
        image: p.cover_image?.url || "",
        intro: p.intro || "",
        tags: p.tags || [],
        slug: p.meta?.slug
    }))
);

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString(locale.value, { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return iso;
    }
}

// Opening the list clears the "new posts" badge in the menu.
const { markAllSeen } = useBlogUpdates();
onMounted(() => {
    markAllSeen();
});

useSeoMeta({
    title: () => `${t("blog.title")} | Axatel`,
    description: () => lead.value,
    ogTitle: () => `${t("blog.title")} Axatel`,
    ogDescription: () => lead.value,
    ogType: "website",
    robots: "index,follow"
});
</script>

<style scoped>
/* Deliberately near-identical to casi/index.vue's styling — same
   visual language across all listing pages on the site. */
.blog-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.blog-hero {
    flex-shrink: 0;
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.blog-hero::after {
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

.blog-light-stage {
    flex: 1;
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.blog-shell {
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

/* "Coming soon" panel while no article is published. */
.news-empty {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    margin-top: 8px;
    padding: clamp(40px, 7vw, 72px) clamp(20px, 5vw, 56px);
    border-radius: 22px;
    text-align: center;
    color: #e8f2ff;
    background: linear-gradient(150deg, #071a2e 0%, #020712 58%, #0b1d33 100%);
    box-shadow: 0 24px 60px rgba(2, 7, 18, 0.28);
}

.news-empty-glow {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
        radial-gradient(circle at 50% 30%, rgba(76, 154, 255, 0.28), transparent 55%),
        radial-gradient(circle at 80% 90%, rgba(234, 63, 48, 0.18), transparent 45%);
}

.news-empty-wings {
    width: clamp(120px, 18vw, 180px);
    height: auto;
    filter: drop-shadow(0 0 18px rgba(120, 190, 255, 0.55));
}

.news-empty-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border: 1px solid rgba(255, 140, 127, 0.55);
    border-radius: 999px;
    color: #ff8a7c;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.news-empty-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ea3f30;
    box-shadow: 0 0 0 0 rgba(234, 63, 48, 0.6);
    animation: news-empty-pulse 1.8s ease-out infinite;
}

@keyframes news-empty-pulse {
    0% { box-shadow: 0 0 0 0 rgba(234, 63, 48, 0.6); }
    70% { box-shadow: 0 0 0 10px rgba(234, 63, 48, 0); }
    100% { box-shadow: 0 0 0 0 rgba(234, 63, 48, 0); }
}

.news-empty h2 {
    margin: 4px 0 0;
    color: #ffffff;
    font-size: clamp(1.6rem, 3.2vw, 2.4rem);
    font-weight: 600;
    line-height: 1.15;
}

.news-empty p {
    max-width: 620px;
    margin: 0;
    color: #c6dcef;
    font-size: 1.05rem;
    line-height: 1.7;
}

.news-empty-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 10px;
}

.news-empty-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 22px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.95rem;
    text-decoration: none;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.news-empty-btn.is-primary {
    background: #c52317;
    color: #fff;
}

.news-empty-btn.is-primary:hover {
    background: #ea3f30;
    transform: translateY(-1px);
}

.news-empty-btn.is-ghost {
    border: 1px solid rgba(198, 220, 239, 0.45);
    color: #e8f2ff;
}

.news-empty-btn.is-ghost:hover {
    border-color: #e8f2ff;
    background: rgba(255, 255, 255, 0.06);
}

.news-empty-btn:focus-visible {
    outline: 2px solid #ff8a7c;
    outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
    .news-empty-dot { animation: none; }
    .news-empty-btn { transition: none; }
}

.blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
}

.post-card {
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;
}

.post-link {
    height: 100%;
    display: grid;
    grid-template-rows: 190px 1fr;
    color: inherit;
    text-decoration: none;
}

.post-media {
    position: relative;
    overflow: hidden;
    background: #eaf1f6;
}

.post-media::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #c52317 0 22%, rgba(197, 35, 23, 0.2) 22% 100%);
}

.post-media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.35s ease;
}

.post-placeholder {
    height: 100%;
    display: grid;
    place-items: center;
    color: #0b355b;
    font-weight: 800;
    text-transform: uppercase;
    text-align: center;
    padding: 0 16px;
}

.post-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
}

.post-meta-top {
    display: flex;
    gap: 12px;
    color: #667f97;
    font-size: 0.78rem;
    font-weight: 700;
}

.post-content h2 {
    margin: 0;
    color: #0b355b;
    font-size: 1.18rem;
    line-height: 1.22;
}

.post-content p {
    margin: 0;
    color: #274e72;
    line-height: 1.5;
}

.post-tags {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.post-tags small {
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    background: rgba(234, 63, 48, 0.12);
    color: #0b355b;
    padding: 5px 8px;
    font-weight: 700;
}

.post-card:hover img {
    transform: scale(1.04);
}

.post-card:hover {
    transform: translateY(-5px);
    border-color: rgba(197, 35, 23, 0.48);
    background: #ffffff;
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

@media (max-width: 768px) {
    .blog-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .blog-shell {
        padding: 5vh 5vw 6vh;
    }
}
</style>
