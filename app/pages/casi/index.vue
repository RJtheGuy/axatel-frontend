<template>
    <main class="cases-page">
        <header class="cases-hero">
<ArticleParticleHero title="Tutti i casi" :asset-url="resolveImage('/immagini/ala.png')" />        </header>

        <div class="cases-light-stage">
            <section class="cases-shell">
                <NuxtLink to="/" class="back-link">Torna alla home</NuxtLink>

                <div class="page-kicker">Casi di successo</div>
                <p class="lead">{{ lead }}</p>

                <p v-if="!cases.length" class="empty">
                    Nessun caso di successo pubblicato al momento.
                </p>

                <div v-else class="cases-grid">
                    <article v-for="item in cases" :key="item.slug" class="case-card">
                        <NuxtLink :to="`/casi/${item.slug}`" class="case-link" :aria-label="`Leggi ${item.title}`">
                            <div class="case-media">
                                <img
                                    v-if="item.image"
                                    :src="item.image"
                                    :alt="item.title"
                                    width="360"
                                    height="220"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div v-else class="case-placeholder">{{ item.category }}</div>
                            </div>

                            <div class="case-content">
                                <div class="case-kicker">{{ item.category }}</div>
                                <h2>{{ item.title }}</h2>
                                <p>{{ item.description }}</p>

                                <div class="case-meta">
                                    <span>{{ item.client }}</span>
                                    <div class="case-tags">
                                        <small v-for="tag in item.tags" :key="tag">{{ tag }}</small>
                                    </div>
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

type CaseItem = {
    title: string;
    client: string;
    category: string;
    image: string;
    description: string;
    tags: string[];
    slug: string;
};

const { data: casiData } = await useAsyncData("casi-list", () =>
    getPage("casi.CasoSuccessoPage", { order: "-first_published_at" }).catch(() => null)
);

// Intro copy now comes from CasiIndexPage.intro, editable in the admin.
const { data: indexPage } = await useAsyncData("casi-index", () =>
    getPageBySlug("casi.CasiIndexPage", "casi").catch(() => null)
);

const DEFAULT_LEAD =
    "Progetti, tecnologie e applicazioni sul campo per infrastrutture piu sicure, monitorate e connesse.";

const lead = computed(() => indexPage.value?.intro?.trim() || DEFAULT_LEAD);

const cases = computed<CaseItem[]>(() =>
    (casiData.value?.items ?? []).map((c: any) => ({
        title: c.title,
        client: c.client || "",
        category: c.category || "",
        image: c.cover_image?.url || "",
        description: c.description || "",
        tags: c.tags || [],
        slug: c.meta?.slug
    }))
);

/*
 * buildArticleRoute() intentionally NOT restored here. It used to point
 * at /articoli/<slug> with the whole case JSON-stringified into a
 * `payload` query param, throwing away the real article body in favor
 * of the one-line card blurb. Links go straight to /casi/<slug>, and
 * pages/casi/[slug].vue fetches the real body from the CMS.
 */

useSeoMeta({
    title: "Casi di successo | Axatel",
    description: () => lead.value,
    ogTitle: "Casi di successo Axatel",
    ogDescription: () => lead.value,
    ogType: "website",
    robots: "index,follow"
});
</script>

<style scoped>
.cases-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.cases-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.cases-hero::after {
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

.cases-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.cases-shell {
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

.page-kicker,
.case-kicker {
    color: #c52317;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.page-kicker {
    padding-left: 14px;
    border-left: 4px solid #c52317;
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

.cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
}

.case-card {
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    border-radius: 0;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;
}

.case-link {
    height: 100%;
    display: grid;
    grid-template-rows: 190px 1fr;
    color: inherit;
    text-decoration: none;
}

.case-media {
    position: relative;
    overflow: hidden;
    background: #eaf1f6;
}

.case-media::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #c52317 0 22%, rgba(197, 35, 23, 0.2) 22% 100%);
}

.case-media img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    transition: transform 0.35s ease;
}

.case-placeholder {
    height: 100%;
    display: grid;
    place-items: center;
    color: #0b355b;
    font-weight: 800;
    text-transform: uppercase;
}

.case-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
}

.case-content h2 {
    margin: 0;
    color: #0b355b;
    font-size: 1.18rem;
    line-height: 1.22;
}

.case-content p {
    margin: 0;
    color: #274e72;
    line-height: 1.5;
}

.case-meta {
    margin-top: auto;
    display: grid;
    gap: 12px;
}

.case-meta > span {
    color: #667f97;
    font-size: 0.82rem;
    font-weight: 700;
}

.case-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.case-tags small {
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    background: rgba(234, 63, 48, 0.12);
    color: #0b355b;
    padding: 5px 8px;
    font-weight: 700;
}

.case-card:hover img {
    transform: scale(1.04);
}

.case-card:hover {
    transform: translateY(-5px);
    border-color: rgba(197, 35, 23, 0.48);
    background: #ffffff;
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

@media (max-width: 768px) {
    .cases-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .cases-shell {
        padding: 5vh 5vw 6vh;
    }
}
</style>