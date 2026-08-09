<template>
    <main class="flex-page">
        <header v-if="page?.title" class="page-head">
            <h1>{{ page.title }}</h1>
        </header>
        <CmsBlockRenderer :blocks="page?.body ?? []" />
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
const { findByPath } = useCms();

const path = computed(() => {
    const s = route.params.slug;
    const joined = Array.isArray(s) ? s.join("/") : String(s ?? "");
    return `/${joined}/`.replace(/\/+/g, "/");
});

const { data: page, error } = await useAsyncData(
    () => `flex-${path.value}`,
    () => findByPath(path.value).catch(() => null),
    { watch: [path] }
);

if (!page.value) {
    throw createError({
        statusCode: 404,
        statusMessage: "Pagina non trovata",
        fatal: true
    });
}

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
