<template>
    <main class="cases-page">
        <DashboardTitoloParticelle class="page-title" title="Tutti i casi" />
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
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
// One level deeper than before — this file moved from pages/casi.vue
// to pages/casi/index.vue so that pages/casi/[slug].vue can sit beside
// it. (Left at pages/casi.vue, Nuxt would treat it as a parent layout
// for the casi/ directory and render nothing without a <NuxtPage />.)
import DashboardTitoloParticelle from "../../components/dashboard/TitoloParticelle.vue";

type CaseItem = {
    title: string;
    client: string;
    category: string;
    image: string;
    description: string;
    tags: string[];
    slug: string;
};

const { getPage, getPageBySlug } = useCms();

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
 * buildArticleRoute() is gone. It used to point at /articoli/<slug> with
 * the whole case JSON-stringified into a `payload` query param — and it
 * passed `content: [item.description]`, i.e. it threw the real article
 * body away and sent the one-line card blurb as the entire article. The
 * same case opened from the homepage carousel showed the full text, so
 * one case rendered two different ways depending on where you clicked.
 *
 * Links now go straight to /casi/<slug>, and pages/casi/[slug].vue
 * fetches the real body from the CMS.
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
    padding: 12vh 8vw 9vh;
    background:
        radial-gradient(circle at 16% 10%, rgba(121, 207, 255, 0.18), transparent 34%),
        radial-gradient(circle at 86% 22%, rgba(234, 63, 48, 0.1), transparent 32%),
        var(--ax-color-bg-main);
}

.page-title {
    max-width: 1180px;
    margin: 0 auto 10px;
}

.cases-shell {
    max-width: 1180px;
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

.page-kicker,
.case-kicker {
    color: var(--ax-color-accent-red-soft);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.lead {
    max-width: 720px;
    margin: 12px 0 28px;
    color: var(--ax-color-text-secondary);
    line-height: 1.58;
}

.empty {
    color: var(--ax-color-text-muted);
    padding: 40px 0;
}

.cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
}

.case-card {
    overflow: hidden;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 14px;
    background: rgba(7, 17, 29, 0.34);
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
    background: linear-gradient(135deg, rgba(234, 63, 48, 0.16), rgba(121, 207, 255, 0.12));
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
    color: var(--ax-color-text-primary);
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
    color: var(--ax-color-text-primary);
    font-size: 1.18rem;
    line-height: 1.22;
}

.case-content p {
    margin: 0;
    color: var(--ax-color-text-secondary);
    line-height: 1.5;
}

.case-meta {
    margin-top: auto;
    display: grid;
    gap: 12px;
}

.case-meta > span {
    color: var(--ax-color-text-muted);
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
    color: var(--ax-color-text-primary);
    padding: 5px 8px;
    font-weight: 700;
}

.case-card:hover img {
    transform: scale(1.04);
}

.case-card:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 140, 127, 0.72);
    background: rgba(10, 24, 38, 0.58);
    box-shadow: 0 22px 44px rgba(0, 0, 0, 0.26);
}

@media (max-width: 768px) {
    .cases-page {
        padding: 7vh 5vw;
    }

    .page-title {
        margin-bottom: 0;
    }
}
</style>