<template>
    <main class="blog-page">
        <header class="blog-hero">
            <ArticleParticleHero title="Blog" :asset-url="resolveImage('/immagini/ala.png')" />
        </header>

        <div class="blog-light-stage">
            <section class="blog-shell">
                <NuxtLink to="/" class="back-link">Torna alla home</NuxtLink>

                <div class="page-kicker">Blog</div>
                <p class="lead">{{ lead }}</p>

                <p v-if="!posts.length" class="empty">
                    Nessun articolo pubblicato al momento.
                </p>

                <div v-else class="blog-grid">
                    <article v-for="item in posts" :key="item.slug" class="post-card">
                        <NuxtLink :to="`/blog/${item.slug}`" class="post-link" :aria-label="`Leggi ${item.title}`">
                            <div class="post-media">
                                <img
                                    v-if="item.image"
                                    :src="item.image"
                                    :alt="item.title"
                                    width="360"
                                    height="220"
                                    loading="lazy"
                                    decoding="async"
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
import { computed } from "vue";
import { useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const { getPage, getPageBySlug } = useCms();

type PostItem = {
    title: string;
    author: string;
    date: string;
    image: string;
    intro: string;
    tags: string[];
    slug: string;
};

const { data: blogData } = await useAsyncData("blog-list", () =>
    getPage("blog.BlogPost", { order: "-date" }).catch(() => null)
);

// Intro copy comes from BlogIndexPage.intro, editable in the admin —
// same convention as casi/index.vue's CasiIndexPage.intro.
const { data: indexPage } = await useAsyncData("blog-index", () =>
    getPageBySlug("blog.BlogIndexPage", "blog").catch(() => null)
);

const DEFAULT_LEAD = "Novità, approfondimenti e aggiornamenti dal mondo Axatel.";

const lead = computed(() => {
    const intro = indexPage.value?.intro;
    // intro is a StreamField (BODY_BLOCKS), not plain text — if it's
    // ever populated with real blocks, prefer rendering it with
    // CmsBlockRenderer instead of this plain-text fallback. Left as a
    // simple default for now since BlogIndexPage.intro is very likely
    // still empty on a fresh install.
    return typeof intro === "string" && intro.trim().length > 0 ? intro : DEFAULT_LEAD;
});

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
        return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return iso;
    }
}

useSeoMeta({
    title: "Blog | Axatel",
    description: () => lead.value,
    ogTitle: "Blog Axatel",
    ogDescription: () => lead.value,
    ogType: "website",
    robots: "index,follow"
});
</script>

<style scoped>
/* Deliberately near-identical to casi/index.vue's styling — same
   visual language across all listing pages on the site. */
.blog-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.blog-hero {
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