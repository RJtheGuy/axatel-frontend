<template>
    <main class="article-page">
        <DashboardTitoloParticelle class="page-title" :title="article.title" />
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

            <img
                v-if="article.image"
                :src="article.image"
                :alt="article.title"
                class="hero-image"
                width="900"
                height="506"
                fetchpriority="high"
                decoding="async"
            />

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
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "#app";
import DashboardTitoloParticelle from "../../components/dashboard/TitoloParticelle.vue";
import DashboardCasiDiSuccessoSection from "../../components/dashboard/CasiDiSuccesso.vue";
import { successCases } from "../../data/successCases";

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
const relatedCases = computed(() => successCases.filter((item) => item.slug !== route.params.slug));

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
</script>

<style scoped>
.article-page {
    min-height: 100vh;
    padding: 12vh 8vw 9vh;
    background:
        radial-gradient(circle at 14% 10%, rgba(121, 207, 255, 0.18), transparent 34%),
        radial-gradient(circle at 88% 24%, rgba(234, 63, 48, 0.1), transparent 30%),
        var(--ax-color-bg-main);
}

.page-title {
    max-width: 980px;
    margin: 0 auto 10px;
}

.article-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 0;
}

.back-link {
    display: inline-block;
    margin-bottom: 18px;
    color: var(--ax-color-accent-red-soft);
    text-decoration: none;
    font-weight: 700;
}

.article-kicker {
    margin-bottom: 10px;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.lead {
    max-width: 760px;
    margin: 10px 0 24px;
    color: var(--ax-color-text-secondary);
    font-size: 1.04rem;
    line-height: 1.62;
}

.article-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin: 0 0 22px;
    padding: 16px 0;
    border-top: 1px solid var(--ax-color-border-soft);
    border-bottom: 1px solid var(--ax-color-border-soft);
}

.meta-item {
    display: grid;
    gap: 4px;
}

.meta-item span {
    color: var(--ax-color-text-muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.meta-item strong {
    color: var(--ax-color-text-primary);
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
    color: var(--ax-color-text-primary);
    padding: 6px 10px;
    font-size: 0.75rem;
    font-weight: 700;
}

.hero-image {
    width: 100%;
    max-height: 420px;
    object-fit: cover;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 14px;
    box-shadow: 0 22px 48px rgba(0, 0, 0, 0.24);
}

.article-content {
    max-width: 760px;
    margin-top: 28px;
}

.article-content p {
    margin: 0 0 14px;
    color: var(--ax-color-text-primary);
    line-height: 1.68;
}

.article-content :deep(h3) {
    margin: 28px 0 12px;
    color: var(--ax-color-text-primary);
    font-size: clamp(1.12rem, 1.8vw, 1.36rem);
    font-weight: 700;
}

.article-content :deep(p) {
    margin: 0 0 14px;
    color: var(--ax-color-text-secondary);
    line-height: 1.72;
}

.article-content :deep(ul),
.article-content :deep(ol) {
    margin: 0 0 18px 1.25rem;
    padding: 0;
    color: var(--ax-color-text-primary);
}

.article-content :deep(li) {
    margin: 0 0 8px;
    line-height: 1.62;
}

.article-content :deep(strong) {
    color: #ffffff;
    font-weight: 800;
}

.related-cases {
    margin-top: 9vh;
}

@media (max-width: 768px) {
    .article-page {
        padding: 7vh 5vw;
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
