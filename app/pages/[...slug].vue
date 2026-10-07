<template>
    <main class="flex-page">
        <header v-if="page?.title" class="page-head">
            <h1>{{ page.title }}</h1>
            <LayoutTranslationNotice v-if="page?.__fallback" class="page-notice" />
        </header>
        <CmsBlockRenderer :blocks="page?.body ?? []" />

        <!-- A "Sezione informativa" (/azienda/, /approfondimenti/) lists its pages. -->
        <section v-if="sectionPages.length" class="section-list" :aria-label="t('info.sectionAria')">
            <p v-if="page?.intro" class="section-intro">{{ page.intro }}</p>
            <div class="section-grid">
                <NuxtLink v-for="item in sectionPages" :key="item.path" :to="localePath(item.path)">
                    {{ item.title }} <span aria-hidden="true">→</span>
                </NuxtLink>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";

/**
 * Catch-all for CMS pages that don't have a dedicated Vue route —
 * primarily home.FlexPage, but this resolves ANY page type by URL path.
 *
 * Nuxt matches this last, so /casi, /casi/<slug> and / keep their own
 * dedicated pages; only unmatched paths land here.
 *
 * Uses the find_view endpoint (core/api.py), which returns page JSON
 * directly instead of Wagtail's default 302 to /pages/<id>/ — one round
 * trip rather than two.
 */
const route = useRoute();
const { t, locale } = useI18n();
const localePath = useLocalePath();
const { findByPath, getChildren } = useCms();

const path = computed(() => {
    const s = route.params.slug;
    const joined = Array.isArray(s) ? s.join("/") : String(s ?? "");
    return `/${joined}/`.replace(/\/+/g, "/");
});

const { data: page, error } = await useAsyncData(
    () => `flex-${locale.value}-${path.value}`,
    async () => {
        try {
            const result = await findByPath(path.value);
            return result;
        } catch (err: any) {
            // Was previously swallowed with .catch(() => null) — logging
            // the real cause instead, since a silent null makes every
            // failure mode (wrong host, CORS, 404, network error, bad
            // params) look identical from the outside.
            // A 404 is a normal "no such page" (often a bot probing
            // addresses). Anything else means the CMS could not answer:
            // passed on, so the visitor gets "try again" (503), not 404.
            const statusCode = err?.statusCode ?? err?.response?.status;
            if (statusCode === 404) return null;
            throw err;
        }
    },
    { watch: [path] }
);

if (!page.value) {
    throw cmsPageError(error.value, useNuxtApp().$i18n.t("errors.page"));
}

const { data: children } = await useAsyncData(
    () => `section-${locale.value}-${path.value}`,
    () =>
        page.value?.meta?.type === "home.InfoIndexPage" && page.value?.id
            ? getChildren(page.value.id, page.value.__fallback ? "it" : locale.value).catch(() => null)
            : Promise.resolve(null),
    { watch: [path] }
);
const sectionPages = computed(() =>
    ((children.value?.items ?? []) as any[])
        .filter((p) => p.meta?.slug)
        .map((p) => ({ title: p.title as string, path: `${path.value}${p.meta.slug}` }))
);

useSeoMeta({
    title: () => page.value?.meta?.seo_title || page.value?.title,
    description: () => page.value?.meta?.search_description,
    ogTitle: () => page.value?.title,
    ogDescription: () => page.value?.meta?.search_description,
    ogType: "website",
    robots: "index,follow"
});
</script>

<style scoped>
.section-list {
    display: grid;
    gap: 18px;
    padding: 0 8vw 12vh;
}

.section-intro {
    max-width: 720px;
    margin: 0;
    color: var(--ax-color-text-secondary);
    line-height: 1.6;
}

.section-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
    max-width: 1000px;
}

.section-grid a {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 20px;
    border: 1px solid rgba(147, 183, 218, 0.24);
    border-radius: 14px;
    color: var(--ax-color-text-primary);
    text-decoration: none;
    transition: border-color 0.15s ease;
}

.section-grid a:hover,
.section-grid a:focus-visible {
    border-color: var(--ax-color-accent-red-soft);
}

.page-notice {
    margin-top: 18px;
    max-width: 720px;
    color: #c6dcef;
    border-color: rgba(147, 183, 218, 0.3);
    background: rgba(147, 183, 218, 0.08);
}

.flex-page {
    min-height: 100vh;
    padding-top: 16vh;
}

.page-head {
    padding: 0 8vw 20px;
}

.page-head h1 {
    margin: 0;
    max-width: 900px;
    font-size: clamp(2rem, 4.4vw, 3.2rem);
    font-weight: 200;
    line-height: 1.08;
}
</style>