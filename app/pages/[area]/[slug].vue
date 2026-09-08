<template>
    <!-- CMS-backed branch: area isn't in contentAreas (e.g. "servizi"),
         so this renders the Wagtail page directly instead of depending
         on router fallthrough to [...slug].vue, which wasn't taking
         effect in practice despite validate returning false. -->
    <main v-if="isCmsBacked" class="flex-page">
        <header v-if="cmsPage?.title" class="page-head">
            <h1>{{ cmsPage.title }}</h1>
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
import { contentAreas, type ContentAreaKey } from "../../data/contentPages";
import { glossaryTerms } from "../../data/glossary";
import type { ContentPageData } from "../../types/contentPage";

const route = useRoute();
const routeValue = (value: string | string[] | undefined): string => Array.isArray(value) ? value[0] || "" : value || "";

const area = computed(() => routeValue(route.params.area));
const slug = computed(() => routeValue(route.params.slug));
const isGlossary = computed(() => area.value === "approfondimenti" && slug.value === "glossario");

// True for any area not in the local contentAreas map — "servizi" today,
// potentially others later if more Wagtail page types get their own
// [area] child pages instead of a dedicated static folder.
const isCmsBacked = computed(() => !(area.value in contentAreas));

const { findByPath } = useCms();

const { data: cmsPage } = await useAsyncData(
    () => `area-cms-${area.value}-${slug.value}`,
    async () => {
        if (!isCmsBacked.value) return null;
        try {
            return await findByPath(`/${area.value}/${slug.value}/`);
        } catch (err: any) {
            console.error("[area/slug] findByPath FAILED for", `/${area.value}/${slug.value}/`, {
                message: err?.message,
                statusCode: err?.statusCode ?? err?.response?.status,
                data: err?.data ?? err?.response?._data
            });
            return null;
        }
    },
    { watch: [area, slug] }
);

if (isCmsBacked.value && !cmsPage.value) {
    throw createError({ statusCode: 404, statusMessage: "Pagina non trovata" });
}

// ── Legacy branch (unchanged) — only evaluated when isCmsBacked is false ──
const areaConfig = computed(() => {
    if (isCmsBacked.value) return null as any;
    return contentAreas[area.value as ContentAreaKey];
});
const page = computed<ContentPageData>(() => {
    if (isCmsBacked.value) return null as any;
    const selectedPage = areaConfig.value.pages[slug.value];
    if (!selectedPage) {
        throw createError({ statusCode: 404, statusMessage: areaConfig.value.notFoundMessage });
    }
    return selectedPage;
});
const relatedPages = computed(() => {
    if (isCmsBacked.value) return [];
    return areaConfig.value.order
        .filter((itemSlug: string) => itemSlug !== slug.value)
        .slice(0, 4)
        .map((itemSlug: string) => areaConfig.value.pages[itemSlug]!);
});

useSeoMeta({
    title: () => isCmsBacked.value
        ? `${cmsPage.value?.title ?? ""} | Axatel`
        : `${page.value.title} | Axatel`,
    description: () => isCmsBacked.value
        ? cmsPage.value?.meta?.search_description
        : page.value.introduction
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