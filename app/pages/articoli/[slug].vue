<template>
    <main class="article-page">
        <header class="article-hero" :style="articleHeroStyle">
            <ArticleParticleHero :title="article.title" :asset-url="titleParticleAsset" />
        </header>

        <div class="article-light-stage">
            <section class="article-shell">
                <NuxtLink to="/" class="back-link">Torna alla home</NuxtLink>

                <div v-if="article.category" class="article-kicker">{{ article.category }}</div>
                <p class="lead">{{ article.description }}</p>

                <div class="article-meta" v-if="article.client || article.tags.length > 0">
                    <div v-if="article.client" class="meta-item">
                        <span>Cliente</span>
                        <strong>{{ article.client }}</strong>
                    </div>
                    <div v-if="article.tags.length > 0" class="meta-tags" aria-label="Tag articolo">
                        <span v-for="tag in article.tags" :key="tag">{{ tag }}</span>
                    </div>
                </div>

                <figure v-if="article.image" class="article-media">
                    <img
                        :src="imageUrl(article.image)"
                        :alt="article.title"
                        width="900"
                        height="506"
                        fetchpriority="high"
                        decoding="async"
                    />
                </figure>

                <div v-if="article.contentHtml" class="article-content" v-html="article.contentHtml"></div>
                <div v-else class="article-content">
                    <p v-for="(paragraph, index) in article.content" :key="index">{{ paragraph }}</p>
                </div>
            </section>

            <DashboardCasiDiSuccessoSection
                class="related-cases"
                title="Altri casi di successo"
                :cases="relatedCases"
                cta-label="Tutti i casi"
                cta-href="/casi"
            />
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";
import DashboardCasiDiSuccessoSection from "../../components/dashboard/CasiDiSuccesso.vue";
import articleSettingsData from "../../data/articleSettings.json";
import { successCases } from "../../data/successCases";

type ArticleVisualSettings = {
    defaults: {
        titleParticleImage: string;
    };
    articles: Record<string, {
        titleParticleImage?: string;
    }>;
};

type ArticleData = {
    title: string;
    description: string;
    image?: string;
    client?: string;
    category?: string;
    tags: string[];
    content: string[];
    contentHtml?: string;
};

type ArticlePayload = Partial<Omit<ArticleData, "content" | "contentHtml">> & {
    content?: string[] | string;
};

const route = useRoute();
const { imageUrl } = useCmsImage();
const relatedCases = computed(() => successCases.filter((item) => item.slug !== route.params.slug));
const articleSettings = articleSettingsData as ArticleVisualSettings;
const titleParticleAsset = computed(() => {
    const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug;
    const configuredName = articleSettings.articles[slug || ""]?.titleParticleImage
        || articleSettings.defaults.titleParticleImage;
    const relativeName = configuredName.trim().replace(/^\/?immagini\//, "");
    const isSafeName = relativeName.length > 0
        && !relativeName.split("/").includes("..")
        && /^[a-zA-Z0-9_./-]+$/.test(relativeName);

    return resolveImage(isSafeName ? relativeName : "ala.png");
});

function sanitizeArticleHtml(value: string): string {
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/\s(href|src)=("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, "");
}

const article = computed<ArticleData>(() => {
    const raw = route.query.payload;
    const payload = Array.isArray(raw) ? raw[0] : raw;

    if (typeof payload === "string" && payload.length > 0) {
        try {
            const decoded = JSON.parse(decodeURIComponent(payload)) as ArticlePayload;
            const title = decoded.title?.trim() || "Articolo";
            const description = decoded.description?.trim() || "";
            const image = decoded.image;
            const client = decoded.client?.trim() || "";
            const category = decoded.category?.trim() || "";
            const tags = Array.isArray(decoded.tags)
                ? decoded.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
                : [];
            const contentHtml = typeof decoded.content === "string" && decoded.content.trim().length > 0
                ? sanitizeArticleHtml(decoded.content)
                : undefined;
            const content = Array.isArray(decoded.content) && decoded.content.length > 0
                ? decoded.content.filter((line): line is string => typeof line === "string")
                : ["Contenuto non disponibile."];

            return { title, description, image, client, category, tags, content, contentHtml };
        } catch {
            return {
                title: "Articolo non disponibile",
                description: "Il contenuto richiesto non e stato trovato.",
                tags: [],
                content: ["Torna alla home e riapri un articolo dalla sezione Casi di successo."]
            };
        }
    }

    return {
        title: "Articolo non disponibile",
        description: "Il contenuto richiesto non e stato trovato.",
        tags: [],
        content: ["Torna alla home e riapri un articolo dalla sezione Casi di successo."]
    };
});

const articleHeroStyle = computed<Record<string, string>>(() => {
    const normalizedLength = article.value.title.trim().replace(/\s+/g, " ").length;
    const desktopLines = Math.max(1, Math.ceil(normalizedLength / 34));
    const mobileLines = Math.max(1, Math.ceil(normalizedLength / 18));
    const desktopHeight = Math.min(320, 200 + (desktopLines - 1) * 56);
    const mobileHeight = Math.min(52, 22 + (mobileLines - 1) * 7);

    return {
        "--article-title-height": `${desktopHeight}px`,
        "--article-title-height-mobile": `${mobileHeight}svh`
    };
});
</script>

<style scoped>
.article-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.article-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + var(--article-title-height, 200px));
    background: #020712;
}

.article-hero::after {
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

.article-media {
    position: relative;
    width: 100%;
    max-height: 420px;
    margin: 0;
    overflow: hidden;
    background: #07111d;
    border: 1px solid rgba(11, 53, 91, 0.14);
    box-shadow: 0 22px 48px rgba(17, 48, 78, 0.14);
}

.article-media::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
        linear-gradient(180deg, rgba(2, 7, 18, 0.24), transparent 34%, transparent 76%, rgba(5, 19, 33, 0.18)),
        linear-gradient(90deg, rgba(6, 28, 48, 0.16), transparent 38%);
}

.article-media::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    height: 3px;
    background: linear-gradient(90deg, #c52317 0 18%, rgba(197, 35, 23, 0.22) 18% 100%);
}

.article-media img {
    width: 100%;
    max-height: 420px;
    display: block;
    object-fit: cover;
}

.article-light-stage {
    position: relative;
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.article-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 7vh 0 5vh;
}

.back-link {
    display: inline-block;
    margin-bottom: 18px;
    color: #c52317;
    text-decoration: none;
    font-weight: 700;
}

.article-kicker {
    margin-bottom: 10px;
    padding-left: 14px;
    border-left: 4px solid #c52317;
    color: #c52317;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.lead {
    max-width: 760px;
    margin: 10px 0 24px;
    color: #274e72;
    font-size: 1.08rem;
    line-height: 1.62;
}

.article-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin: 0 0 22px;
    padding: 16px 0;
    border-top: 1px solid rgba(11, 53, 91, 0.18);
    border-bottom: 1px solid rgba(11, 53, 91, 0.18);
}

.meta-item {
    display: grid;
    gap: 4px;
}

.meta-item span {
    color: #667f97;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.meta-item strong {
    color: #0b355b;
    font-size: 0.95rem;
}

.meta-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
}

.meta-tags span {
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    background: rgba(234, 63, 48, 0.12);
    color: #0b355b;
    padding: 6px 10px;
    font-size: 0.75rem;
    font-weight: 700;
}

.article-content {
    max-width: 760px;
    margin-top: 28px;
}

.article-content p {
    margin: 0 0 14px;
    color: #274e72;
    line-height: 1.68;
}

.article-content :deep(h3) {
    margin: 28px 0 12px;
    padding-left: 14px;
    border-left: 4px solid #c52317;
    color: #0b355b;
    font-size: clamp(1.12rem, 1.8vw, 1.36rem);
    font-weight: 700;
}

.article-content :deep(p) {
    margin: 0 0 14px;
    color: #274e72;
    line-height: 1.72;
}

.article-content :deep(ul),
.article-content :deep(ol) {
    margin: 0 0 18px 1.25rem;
    padding: 0;
    color: #274e72;
}

.article-content :deep(li) {
    margin: 0 0 8px;
    line-height: 1.62;
}

.article-content :deep(strong) {
    color: #0b355b;
    font-weight: 800;
}

.related-cases {
    margin-top: 2vh;
    color: #0b355b;
    background: transparent;
}

.related-cases :deep(.kicker) {
    color: #0b355b;
    text-shadow: none;
}

.related-cases :deep(.casi-cta) {
    color: #0b355b;
    border-color: rgba(197, 35, 23, 0.55);
}

@media (max-width: 768px) {
    .article-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + var(--article-title-height-mobile, 22svh));
    }

    .article-shell {
        padding: 5vh 5vw 3vh;
    }

    .article-media {
        max-height: 360px;
    }

    .article-media img {
        max-height: 360px;
    }

    .article-meta {
        align-items: flex-start;
        flex-direction: column;
    }

    .meta-tags {
        justify-content: flex-start;
    }
}
</style>
