<template>
    <main class="mon-page">
        <header class="mon-hero">
            <ArticleParticleHero :title="t('monitoring.title')" :asset-url="headerWing()" />
        </header>

        <div class="mon-light-stage">
            <section class="mon-shell">
                <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

                <div class="page-kicker">{{ t("monitoring.kicker") }}</div>
                <p class="lead">{{ lead }}</p>
                <LayoutTranslationNotice v-if="hasUntranslated" />

                <p v-if="!topics.length" class="empty">{{ t("monitoring.empty") }}</p>

                <!-- Area filter (Ambiente / Viabilità / Strutture), same look as the
                     sector filter on Casi di successo. Kept in the URL (?ambito=…). -->
                <div v-if="groups.length > 1" class="mon-filters" role="group" :aria-label="t('monitoring.filterLabel')">
                    <button type="button" class="chip" :aria-pressed="!activeGroup" @click="setGroup('')">
                        {{ t("monitoring.all") }} <span>{{ topics.length }}</span>
                    </button>
                    <button
                        v-for="group in groups"
                        :key="group.key"
                        type="button"
                        class="chip"
                        :aria-pressed="activeGroup === group.key"
                        @click="setGroup(group.key)"
                    >{{ group.label }} <span>{{ group.count }}</span></button>
                </div>

                <div v-if="visibleTopics.length" class="mon-grid">
                    <article
                        v-for="item in visibleTopics"
                        :key="item.slug"
                        class="topic-card"
                        :class="[`is-${item.groupKey}`, { 'is-soon': item.comingSoon }]"
                    >
                        <NuxtLink :to="localePath(`/monitoraggio/${item.slug}`)" class="topic-link">
                            <div class="topic-media" aria-hidden="true">
                                <img v-if="item.image" :src="item.image" alt="" width="150" height="150" loading="lazy" decoding="async" />
                                <span v-else class="topic-icon">{{ item.icon || item.shortTitle.charAt(0) }}</span>
                                <span v-if="item.comingSoon" class="topic-soon">{{ t("monitoring.soon") }}</span>
                            </div>
                            <div class="topic-content">
                                <div class="topic-kicker">{{ item.groupLabel }}</div>
                                <!-- Hidden (still read by screen readers) when "Mostra titolo
                                     nella card" is off because the picture contains it. -->
                                <h2 :class="{ 'visually-hidden': !item.showTitle }">{{ item.shortTitle }}</h2>
                                <p>{{ item.description }}</p>
                                <div v-if="item.tags.length" class="topic-tags">
                                    <small v-for="tag in item.tags" :key="tag">{{ tag }}</small>
                                </div>
                                <span class="topic-more">{{ t("common.discover") }} <span aria-hidden="true">→</span></span>
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
import { monitoringOrder, monitoringPages } from "../../data/monitoring";
import { showCardTitle } from "../../utils/pageMeta";

const { getPage, getPageBySlug } = useCms();
const { t, locale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();
const router = useRouter();
const { imageUrl } = useCmsImage();

type TopicItem = {
    title: string;
    icon: string;
    description: string;
    groupKey: string;
    groupLabel: string;
    image: string;
    tags: string[];
    slug: string;
    shortTitle: string;
    showTitle: boolean;
    comingSoon: boolean;
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

// Same order as the "Cosa monitoriamo?" menu.
const GROUP_ORDER = ["ambiente", "viabilita", "strutture"];
const normalize = (value: string) =>
    String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const groupLabel = (key: string, raw: string) =>
    [...GROUP_ORDER, "altro"].includes(key) ? t(`monitoring.groups.${key}`) : capitalize(raw);

const shorten = (title: string) =>
    // "Monitoraggio frane" → "Frane" (and "Traffic monitoring" → "Traffic"):
    // the label above the title already says what it is.
    capitalize(String(title || "").replace(/^(monitoraggio|surveillance( des| du| de la)?)\s+/i, "").replace(/\s+monitoring$/i, ""));

function capitalize(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

// CMS topics (Pagine → Monitoraggio) first; a topic not in the CMS comes
// from the built-in list (data/monitoring.ts). A CMS topic without category,
// icon or picture borrows them from the built-in topic with the same slug,
// so it still lands in the right area with a picture.
const topics = computed<TopicItem[]>(() => {
    const cms = ((monData.value?.items ?? []) as any[]).map((p) => {
        const slug = p.meta?.slug;
        const builtIn = monitoringPages[slug];
        const rawGroup = p.category || builtIn?.group || "";
        const key = normalize(rawGroup) || "altro";
        const hasBody = Array.isArray(p.body) ? p.body.length > 0 : Boolean(p.body);
        return {
            title: p.title,
            icon: p.icon || "",
            description: p.short_description || builtIn?.introduction || "",
            groupKey: key,
            groupLabel: groupLabel(key, rawGroup),
            image: p.cover_image?.url ? imageUrl(p.cover_image.url) : builtIn?.image || "",
            tags: p.tags || [],
            slug,
            shortTitle: shorten(p.title),
            showTitle: showCardTitle(p, Boolean(p.cover_image?.url || builtIn?.image)),
            comingSoon: !hasBody && (!builtIn || builtIn.status === "coming-soon"),
        };
    });
    const inCms = new Set(cms.map((p) => p.slug));
    // Once the CMS answers, a written topic missing from it was hidden on
    // purpose (unpublished); only "coming soon" placeholders are added.
    const cmsAnswered = cms.length > 0;
    const builtIn = monitoringOrder
        .filter((slug) => !inCms.has(slug) && !(cmsAnswered && monitoringPages[slug]?.status === "published"))
        .map((slug) => monitoringPages[slug]!)
        .map((p) => {
            const key = normalize(p.group) || "altro";
            return {
                title: p.title,
                icon: "",
                description: p.introduction,
                groupKey: key,
                groupLabel: groupLabel(key, p.group),
                image: p.image || "",
                tags: [],
                slug: p.slug,
                shortTitle: shorten(p.title),
                showTitle: true,
                comingSoon: p.status === "coming-soon",
            };
        });
    const rank = (key: string) => (GROUP_ORDER.indexOf(key) === -1 ? 99 : GROUP_ORDER.indexOf(key));
    // Area order, then written topics before "coming soon", then A-Z.
    return [...cms, ...builtIn].sort(
        (a, b) =>
            rank(a.groupKey) - rank(b.groupKey) ||
            a.groupKey.localeCompare(b.groupKey) ||
            Number(a.comingSoon) - Number(b.comingSoon) ||
            a.shortTitle.localeCompare(b.shortTitle, locale.value)
    );
});

// Built-in topics and CMS pages not translated yet are in Italian.
const hasUntranslated = computed(
    () =>
        ((monData.value?.items ?? []) as any[]).some((p) => p.__fallback) ||
        (locale.value !== "it" && topics.value.length > ((monData.value?.items ?? []) as any[]).length)
);

const groups = computed(() => {
    const seen = new Map<string, { key: string; label: string; count: number }>();
    for (const item of topics.value) {
        const entry = seen.get(item.groupKey) ?? { key: item.groupKey, label: item.groupLabel, count: 0 };
        entry.count += 1;
        seen.set(item.groupKey, entry);
    }
    return [...seen.values()];
});

const activeGroup = computed(() => {
    const q = String(route.query.ambito ?? "");
    return groups.value.some((g) => g.key === q) ? q : "";
});

const visibleTopics = computed(() =>
    activeGroup.value ? topics.value.filter((item) => item.groupKey === activeGroup.value) : topics.value
);

function setGroup(key: string): void {
    const query = { ...route.query };
    if (key) query.ambito = key;
    else delete query.ambito;
    router.replace({ query });
}

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
/* Same visual language as casi/index.vue (Casi di successo). */
.mon-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.mon-hero {
    flex-shrink: 0;
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
    flex: 1;
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

.page-kicker,
.topic-kicker {
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

/* -- filter chips (as on Casi di successo) -------------------------------- */
.mon-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 24px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid rgba(11, 53, 91, 0.2);
    border-radius: 999px;
    background: #fff;
    color: #0b355b;
    font: inherit;
    font-size: 0.86rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.chip span {
    color: #667f97;
    font-size: 0.76rem;
    font-variant-numeric: tabular-nums;
}

.chip:hover {
    border-color: #c52317;
}

.chip[aria-pressed="true"] {
    border-color: #c52317;
    background: #c52317;
    color: #fff;
}

.chip[aria-pressed="true"] span {
    color: rgba(255, 255, 255, 0.8);
}

.chip:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: 2px;
}

/* -- cards ---------------------------------------------------------------- */
.mon-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
}

.topic-card {
    --tint: #e8f0f7;
    --tint-deep: #d5e3ef;
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;
}

/* A quiet colour per area, so the grid reads at a glance. */
.topic-card.is-ambiente {
    --tint: #e7f3ef;
    --tint-deep: #d2e9e1;
}

.topic-card.is-viabilita {
    --tint: #f6eeea;
    --tint-deep: #efdcd4;
}

.topic-card.is-strutture {
    --tint: #e9eff7;
    --tint-deep: #d6e1ef;
}

.topic-link {
    height: 100%;
    display: grid;
    grid-template-rows: 180px 1fr;
    color: inherit;
    text-decoration: none;
}

/* The pictures are round product pictograms: shown whole on a tinted
   panel, never cropped. */
.topic-media {
    position: relative;
    display: grid;
    place-items: center;
    overflow: hidden;
    background:
        radial-gradient(circle at 50% 55%, #ffffff 0 34%, transparent 70%),
        linear-gradient(160deg, var(--tint) 0%, var(--tint-deep) 100%);
}

.topic-media::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #c52317 0 22%, rgba(197, 35, 23, 0.2) 22% 100%);
}

.topic-media img {
    width: 132px;
    height: 132px;
    object-fit: contain;
    transition: transform 0.35s ease;
}

.topic-icon {
    font-size: 3.6rem;
    line-height: 1;
    color: #0b355b;
    font-weight: 700;
}

.topic-soon {
    position: absolute;
    top: 14px;
    right: 14px;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(11, 53, 91, 0.86);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.topic-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
}

.topic-content h2 {
    margin: 0;
    color: #0b355b;
    font-size: 1.18rem;
    line-height: 1.22;
}

.topic-content p {
    margin: 0;
    color: #274e72;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.topic-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.topic-tags small {
    border: 1px solid rgba(234, 63, 48, 0.28);
    border-radius: 999px;
    background: rgba(234, 63, 48, 0.12);
    color: #0b355b;
    padding: 5px 8px;
    font-weight: 700;
}

.topic-more {
    margin-top: auto;
    padding-top: 4px;
    color: #c52317;
    font-size: 0.86rem;
    font-weight: 700;
}

.topic-card.is-soon .topic-media img,
.topic-card.is-soon .topic-icon {
    opacity: 0.72;
}

.topic-link:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: -2px;
}

.topic-card:hover {
    transform: translateY(-5px);
    border-color: rgba(197, 35, 23, 0.48);
    background: #ffffff;
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

.topic-card:hover .topic-media img {
    transform: scale(1.05);
}

@media (prefers-reduced-motion: reduce) {
    .topic-card,
    .topic-card:hover,
    .topic-card:hover .topic-media img {
        transition: none;
        transform: none;
    }
}

@media (max-width: 980px) {
    .mon-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 600px) {
    .mon-grid {
        grid-template-columns: 1fr;
    }

    .topic-link {
        grid-template-rows: 150px 1fr;
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
