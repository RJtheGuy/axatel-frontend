<template>
    <!-- 1. Azienda / Approfondimenti page from the CMS (Pagina informativa,
         Glossario). 2. Any other CMS page under an area without its own
         folder (e.g. a Servizio). 3. The built-in page from
         data/contentPages.ts while the CMS has none. -->
    <InfoPageView v-if="isInfoPage" :page="cmsPage" :area="area" />

    <main v-else-if="cmsPage" class="flex-page">
        <header v-if="cmsPage?.title" class="page-head">
            <h1>{{ cmsPage.title }}</h1>
            <LayoutTranslationNotice v-if="cmsPage?.__fallback" />
        </header>
        <CmsBlockRenderer :blocks="cmsPage?.body ?? []" />
    </main>

    <ContentPage
        v-else
        :page="page"
        :breadcrumb-label="areaConfig.label"
        :base-path="areaConfig.basePath"
        :related-pages="relatedPages"
        :related-label="`Altre pagine: ${areaConfig.label}`"
        :glossary-terms="isGlossary ? glossaryTerms : []"
    />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { createError, useAsyncData, useRoute, useSeoMeta } from "#app";
import ContentPage from "../../components/content/ContentPage.vue";
import InfoPageView from "../../components/content/InfoPageView.vue";
import { contentAreas, type ContentAreaKey } from "../../data/contentPages";
import { glossaryTerms } from "../../data/glossary";
import type { ContentPageData } from "../../types/contentPage";

const route = useRoute();
const { locale } = useI18n();
const routeValue = (value: string | string[] | undefined): string => Array.isArray(value) ? value[0] || "" : value || "";

const area = computed(() => routeValue(route.params.area));
const slug = computed(() => routeValue(route.params.slug));
const isGlossary = computed(() => area.value === "approfondimenti" && slug.value === "glossario");

// Areas with built-in pages (azienda, approfondimenti) still have a
// fallback; any other area ("servizi") exists only in the CMS.
const hasBuiltIn = computed(() => area.value in contentAreas);
const builtInPage = computed<ContentPageData | undefined>(() =>
    hasBuiltIn.value ? contentAreas[area.value as ContentAreaKey].pages[slug.value] : undefined
);

const { findByPath } = useCms();

// The CMS page at this address, if one is published.
const { data: cmsPage } = await useAsyncData(
    () => `area-cms-${locale.value}-${area.value}-${slug.value}`,
    () => findByPath<any>(`/${area.value}/${slug.value}/`).catch(() => null),
    { watch: [area, slug] }
);

const isInfoPage = computed(() =>
    ["home.InfoPage", "home.GlossaryPage"].includes(cmsPage.value?.meta?.type)
);

if (!cmsPage.value && !builtInPage.value) {
    throw createError({
        statusCode: 404,
        statusMessage: hasBuiltIn.value
            ? contentAreas[area.value as ContentAreaKey].notFoundMessage
            : useNuxtApp().$i18n.t("errors.page"),
    });
}

// ── Built-in branch, only used when the CMS has no page here ──
const areaConfig = computed(() => (hasBuiltIn.value ? contentAreas[area.value as ContentAreaKey] : (null as any)));
const page = computed<ContentPageData>(() => builtInPage.value as ContentPageData);
const relatedPages = computed(() => {
    if (!hasBuiltIn.value) return [];
    return areaConfig.value.order
        .filter((itemSlug: string) => itemSlug !== slug.value)
        .slice(0, 4)
        .map((itemSlug: string) => areaConfig.value.pages[itemSlug]!);
});

useSeoMeta({
    title: () => `${cmsPage.value?.title ?? page.value?.title ?? ""} | Axatel`,
    description: () =>
        cmsPage.value
            ? cmsPage.value.meta?.search_description || cmsPage.value.introduction || ""
            : page.value?.introduction,
    ogTitle: () => cmsPage.value?.title ?? page.value?.title,
    ogImage: () => cmsPage.value?.cover_image?.url,
    robots: () => (!cmsPage.value && page.value?.status === "coming-soon" ? "noindex,follow" : "index,follow"),
});
</script>

<style scoped>
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