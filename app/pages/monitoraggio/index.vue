<template>
    <main class="mon-page">
        <header class="mon-hero">
            <ArticleParticleHero title="Monitoraggio" :asset-url="resolveImage('/immagini/ala.png')" />
        </header>

        <div class="mon-light-stage">
            <section class="mon-shell">
                <NuxtLink to="/" class="back-link">Torna alla home</NuxtLink>

                <div class="page-kicker">Cosa monitoriamo</div>
                <p class="lead">{{ lead }}</p>

                <p v-if="!topics.length" class="empty">
                    Nessun argomento pubblicato al momento.
                </p>

                <div v-else class="mon-grid">
                    <article v-for="item in topics" :key="item.slug" class="topic-card">
                        <NuxtLink :to="`/monitoraggio/${item.slug}`" class="topic-link" :aria-label="`Leggi ${item.title}`">
                            <div class="topic-media">
                                <img v-if="item.image" :src="imageUrl(item.image)" :alt="item.image_alt || item.title" width="480" height="280" loading="lazy" decoding="async" />
                                <div v-else class="topic-placeholder">{{ item.category || "Monitoraggio" }}</div>
                            </div>
                            <div class="topic-content">
                                <div v-if="item.category" class="topic-category">{{ item.category }}</div>
                                <h2>{{ item.title }}</h2>
                                <p>{{ item.description }}</p>
                                <div v-if="item.tags.length" class="topic-tags">
                                    <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
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
const { imageUrl } = useCmsImage();

type TopicItem = {
    title: string;
    icon: string;
    description: string;
    category: string;
    image: string;
    image_alt: string;
    tags: string[];
    slug: string;
};

const { data: monData } = await useAsyncData("monitoraggio-list", () =>
    getPage("monitoring.MonitoringPage", { order: "title" }).catch(() => null)
);

const { data: indexPage } = await useAsyncData("monitoraggio-index", () =>
    getPageBySlug("monitoring.MonitoringIndexPage", "monitoraggio").catch(() => null)
);

const DEFAULT_LEAD = "Le soluzioni Axatel per osservare infrastrutture, territorio e ambiente.";

const lead = computed(() => {
    const intro = indexPage.value?.intro;
    return typeof intro === "string" && intro.trim().length > 0 ? intro : DEFAULT_LEAD;
});

const topics = computed<TopicItem[]>(() =>
    (monData.value?.items ?? []).map((p: any) => ({
        title: p.title,
        icon: p.icon || "",
        description: p.short_description || "",
        category: p.category || "",
        image: p.cover_image?.url || "",
        image_alt: p.cover_image?.alt || "",
        tags: p.tags || [],
        slug: p.meta?.slug
    }))
);

useSeoMeta({
    title: "Cosa monitoriamo | Axatel",
    description: () => lead.value,
    ogTitle: "Cosa monitoriamo | Axatel",
    ogDescription: () => lead.value,
    ogType: "website",
    robots: "index,follow"
});
</script>

<style scoped>
/* Same visual language as blog/index.vue and casi/index.vue. */
.mon-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.mon-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.mon-hero::after {
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

.mon-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.mon-shell {
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

.mon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 18px;
}

.topic-card {
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;
}

.topic-media {
    height: 190px;
    overflow: hidden;
    background: #eaf1f6;
}

.topic-media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
}

.topic-placeholder {
    height: 100%;
    display: grid;
    place-items: center;
    color: #0b355b;
    font-weight: 800;
    text-transform: uppercase;
}

.topic-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
}

.topic-category {
    color: #c52317;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.topic-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.topic-tags span {
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    padding: 5px 8px;
    color: #0b355b;
    font-size: 0.75rem;
    font-weight: 700;
}

.topic-link {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 26px;
    height: 100%;
    color: inherit;
    text-decoration: none;
}

.topic-icon {
    font-size: 2rem;
    line-height: 1;
}

.topic-link h2 {
    margin: 0;
    color: #0b355b;
    font-size: 1.14rem;
}

.topic-link p {
    margin: 0;
    color: #274e72;
    line-height: 1.5;
}

.topic-card:hover {
    transform: translateY(-5px);
    border-color: rgba(197, 35, 23, 0.48);
    background: #ffffff;
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

@media (max-width: 768px) {
    .mon-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .mon-shell {
        padding: 5vh 5vw 6vh;
    }
}
</style>