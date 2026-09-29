<template>
    <main class="mon-page">
        <header class="mon-hero">
            <ArticleParticleHero :title="t('monitoring.title')" :asset-url="resolveImage('/immagini/ala.png')" />
        </header>

        <div class="mon-light-stage">
            <section class="mon-shell">
                <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

                <div class="page-kicker">{{ t("monitoring.kicker") }}</div>
                <p class="lead">{{ lead }}</p>
                <LayoutTranslationNotice v-if="hasUntranslated" />

                <p v-if="!topics.length" class="empty">
                    {{ t("monitoring.empty") }}
                </p>

                <template v-else>
                    <section
                        v-for="group in groups"
                        :key="group.label"
                        class="mon-group"
                        :aria-labelledby="`group-${group.key}`"
                    >
                        <header class="mon-group-head">
                            <h2 :id="`group-${group.key}`">{{ group.label }}</h2>
                            <span class="mon-group-count">{{ t("monitoring.areas", { n: group.items.length }, group.items.length) }}</span>
                        </header>

                        <div class="mon-grid">
                            <article v-for="item in group.items" :key="item.slug" class="topic-card">
                                <NuxtLink :to="localePath(`/monitoraggio/${item.slug}`)" class="topic-link">
                                    <div class="topic-media" aria-hidden="true">
                                        <img v-if="item.image" :src="imageUrl(item.image)" alt="" width="160" height="160" loading="lazy" decoding="async" />
                                        <span v-else class="topic-placeholder">{{ item.icon || item.shortTitle.charAt(0) }}</span>
                                    </div>
                                    <div class="topic-content">
                                        <h3>{{ item.shortTitle }}</h3>
                                        <p>{{ item.description }}</p>
                                        <div v-if="item.tags.length" class="topic-tags">
                                            <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
                                        </div>
                                        <span class="topic-more">{{ t("common.discover") }} <span aria-hidden="true">→</span></span>
                                    </div>
                                </NuxtLink>
                            </article>
                        </div>
                    </section>
                </template>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";
import { monitoringOrder, monitoringPages } from "../../data/monitoring";

const { getPage, getPageBySlug } = useCms();
const { t, locale } = useI18n();
const localePath = useLocalePath();
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
    shortTitle: string;
};

const { data: monData } = await useAsyncData(() => `monitoraggio-list-${locale.value}`, () =>
    getPage("monitoring.MonitoringPage", { order: "title" }).catch(() => null),
    { watch: [locale] }
);

const { data: indexPage } = await useAsyncData(() => `monitoraggio-index-${locale.value}`, () =>
    getPageBySlug("monitoring.MonitoringIndexPage", "monitoraggio").catch(() => null),
    { watch: [locale] }
);

// The index intro is a StreamField (blocks), not plain text, so the
// built-in lead is what normally shows. Use a translated index intro only
// if it ever arrives as plain text in the current language.
const lead = computed(() => {
    const intro = indexPage.value?.intro;
    const usable = typeof intro === "string" && intro.trim().length > 0 && !indexPage.value?.__fallback;
    return usable ? intro : t("monitoring.lead");
});

const shorten = (title: string) =>
    // "Monitoraggio frane" → "Frane" (and "Traffic monitoring" → "Traffic"):
    // the group heading already says what it is.
    capitalize(String(title || "").replace(/^(monitoraggio|surveillance( des| du| de la)?)\s+/i, "").replace(/\s+monitoring$/i, ""));

// CMS topics (Pagine → Monitoraggio) first; any topic not in the CMS yet
// comes from the built-in list (data/monitoring.ts), so nothing disappears
// from this page while the topics are being moved into the CMS.
const topics = computed<TopicItem[]>(() => {
    const cms = ((monData.value?.items ?? []) as any[]).map((p) => ({
        title: p.title,
        icon: p.icon || "",
        description: p.short_description || "",
        category: p.category || "",
        image: p.cover_image?.url || "",
        image_alt: p.cover_image?.alt || "",
        tags: p.tags || [],
        slug: p.meta?.slug,
        shortTitle: shorten(p.title),
    }));
    const inCms = new Set(cms.map((p) => p.slug));
    const builtIn = monitoringOrder
        .filter((slug) => !inCms.has(slug))
        .map((slug) => monitoringPages[slug]!)
        .map((p) => ({
            title: p.title,
            icon: "",
            description: p.introduction,
            category: p.group,
            image: p.image || "",
            image_alt: p.imageAlt || "",
            tags: [],
            slug: p.slug,
            shortTitle: shorten(p.title),
        }));
    return [...cms, ...builtIn];
});

// Built-in topics and CMS pages not translated yet are in Italian.
const hasUntranslated = computed(
    () =>
        ((monData.value?.items ?? []) as any[]).some((p) => p.__fallback) ||
        (locale.value !== "it" && topics.value.length > ((monData.value?.items ?? []) as any[]).length)
);

function capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

// Same order as the "Cosa monitoriamo?" menu. Anything with another
// category (or none) goes into a final group, so nothing disappears.
const GROUP_ORDER = ["ambiente", "viabilita", "strutture"];
const normalize = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const groups = computed(() => {
    const map = new Map<string, TopicItem[]>();
    for (const item of topics.value) {
        const key = normalize(item.category) || "altro";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(item);
    }
    const keys = [...map.keys()].sort((a, b) => {
        const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
    return keys.map((key) => ({
        key,
        label: ["ambiente", "viabilita", "strutture", "altro"].includes(key) ? t(`monitoring.groups.${key}`) : capitalize(key),
        items: map.get(key)!.sort((x, y) => x.shortTitle.localeCompare(y.shortTitle, locale.value)),
    }));
});

useSeoMeta({
    title: () => `${t("monitoring.kicker")} | Axatel`,
    description: () => lead.value,
    ogTitle: () => `${t("monitoring.kicker")} | Axatel`,
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
    padding: 7vh 24px 8vh;
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

.mon-group + .mon-group {
    margin-top: 56px;
}

.mon-group-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    margin: 0 0 18px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(11, 53, 91, 0.12);
}

.mon-group-head h2 {
    margin: 0;
    color: #0b355b;
    font-size: 1.5rem;
    font-weight: 600;
}

.mon-group-count {
    color: #667f97;
    font-size: 0.82rem;
    font-variant-numeric: tabular-nums;
}

.mon-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 18px;
}

.topic-card {
    border: 1px solid rgba(11, 53, 91, 0.12);
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 10px 26px rgba(17, 48, 78, 0.06);
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.topic-link {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    height: 100%;
    padding: 22px;
    color: inherit;
    text-decoration: none;
}

/* Pictograms are square icons: show them whole, small, never cropped. */
.topic-media {
    flex: 0 0 72px;
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #f1f5f9;
}

.topic-media img {
    width: 60px;
    height: 60px;
    object-fit: contain;
}

.topic-placeholder {
    font-size: 1.9rem;
    font-weight: 700;
    color: #0b355b;
    line-height: 1;
}

.topic-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.topic-link h3 {
    margin: 0;
    color: #0b355b;
    font-size: 1.12rem;
    font-weight: 600;
}

.topic-link p {
    margin: 0;
    color: #274e72;
    font-size: 0.94rem;
    line-height: 1.5;
}

.topic-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.topic-tags span {
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    padding: 4px 8px;
    color: #0b355b;
    font-size: 0.72rem;
    font-weight: 600;
}

.topic-more {
    margin-top: 4px;
    color: #c52317;
    font-size: 0.84rem;
    font-weight: 700;
}

.topic-link:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: 3px;
    border-radius: 14px;
}

.topic-card:hover {
    transform: translateY(-3px);
    border-color: rgba(197, 35, 23, 0.4);
    box-shadow: 0 18px 38px rgba(17, 48, 78, 0.12);
}

@media (prefers-reduced-motion: reduce) {
    .topic-card,
    .topic-card:hover {
        transition: none;
        transform: none;
    }
}

@media (max-width: 420px) {
    .mon-grid {
        grid-template-columns: 1fr;
    }
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