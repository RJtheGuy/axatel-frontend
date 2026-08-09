<template>
    <main class="caso-page">
        <article class="caso-container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <ol role="list">
                    <li><NuxtLink to="/">Home</NuxtLink></li>
                    <li><NuxtLink to="/casi">Casi di successo</NuxtLink></li>
                    <li aria-current="page">{{ caso?.title }}</li>
                </ol>
            </nav>

            <img
                v-if="caso?.cover_image?.url"
                class="caso-cover"
                :src="caso.cover_image.url"
                :alt="caso.cover_image.alt || caso.title"
                :width="caso.cover_image.width"
                :height="caso.cover_image.height"
                decoding="async"
            />

            <header class="caso-header">
                <p v-if="caso?.category" class="caso-category">{{ caso.category }}</p>
                <h1>{{ caso?.title }}</h1>
                <p v-if="caso?.client" class="caso-client">{{ caso.client }}</p>

                <ul v-if="caso?.tags?.length" class="tag-list" role="list">
                    <li v-for="tag in caso.tags" :key="tag">#{{ tag }}</li>
                </ul>
            </header>

            <!-- Editor-authored HTML from a Wagtail RichTextField.
                 v-html is correct here: the content is authored in the
                 CMS admin by trusted staff, not submitted by end users.
                 Do not "fix" this to {{ }} — it would render escaped
                 markup as literal text. -->
            <div v-if="caso?.body" class="caso-body" v-html="caso.body"></div>

            <NuxtLink class="caso-back ax-cta-outline" to="/casi">
                Tutti i casi di successo
            </NuxtLink>
        </article>
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";

const route = useRoute();
const { getPageBySlug } = useCms();

const slug = computed(() => String(route.params.slug));

const { data: caso } = await useAsyncData(
    () => `caso-${slug.value}`,
    () => getPageBySlug("casi.CasoSuccessoPage", slug.value),
    { watch: [slug] }
);

if (!caso.value) {
    throw createError({
        statusCode: 404,
        statusMessage: "Caso di successo non trovato",
        fatal: true
    });
}

useSeoMeta({
    title: () => `${caso.value?.title} | Casi di successo Axatel`,
    description: () => caso.value?.meta?.search_description || caso.value?.description,
    ogTitle: () => caso.value?.title,
    ogDescription: () => caso.value?.description,
    ogImage: () => caso.value?.cover_image?.url,
    ogType: "article",
    robots: "index,follow"
});

// Article structured data. The equivalent used to live in a Django
// template ({% block schema_org %} in blog_post.html), which never
// reaches a headless frontend — the API returns JSON, not that HTML.
useHead({
    script: [
        {
            type: "application/ld+json",
            innerHTML: computed(() =>
                JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Article",
                    headline: caso.value?.title,
                    description: caso.value?.description,
                    image: caso.value?.cover_image?.url,
                    datePublished: caso.value?.meta?.first_published_at,
                    dateModified: caso.value?.meta?.last_published_at,
                    publisher: {
                        "@type": "Organization",
                        name: "Axatel",
                        url: "https://axatel.it"
                    }
                })
            )
        }
    ]
});
</script>

<style scoped>
.caso-page {
    min-height: 100vh;
    padding: 18vh 8vw 12vh;
}

.caso-container {
    max-width: 820px;
    margin: 0 auto;
}

.breadcrumb ol {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    margin: 0 0 32px;
    padding: 0;
    font-size: 0.82rem;
    color: var(--ax-color-text-muted);
}

.breadcrumb li + li::before {
    content: "/";
    margin-right: 8px;
    opacity: 0.5;
}

.breadcrumb a {
    color: var(--ax-color-text-secondary);
    text-decoration: none;
}

.breadcrumb a:hover {
    color: var(--ax-color-text-primary);
}

.caso-cover {
    width: 100%;
    height: auto;
    max-height: 460px;
    object-fit: cover;
    border-radius: var(--ax-card-radius);
    border: 1px solid var(--ax-color-border-soft);
    margin-bottom: 40px;
}

.caso-header {
    margin-bottom: 44px;
}

.caso-category {
    margin: 0 0 12px;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.caso-header h1 {
    margin: 0 0 14px;
    font-size: clamp(1.9rem, 4vw, 3rem);
    font-weight: 300;
    line-height: 1.1;
}

.caso-client {
    margin: 0;
    color: var(--ax-color-text-muted);
    font-size: 0.95rem;
}

.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    list-style: none;
    margin: 22px 0 0;
    padding: 0;
}

.tag-list li {
    padding: 6px 14px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 999px;
    color: var(--ax-color-text-secondary);
    font-size: 0.76rem;
    letter-spacing: 0.03em;
}

/* Deep selectors: the body is injected via v-html, so scoped styles
   don't reach it without :deep(). */
.caso-body :deep(p) {
    margin: 0 0 1.4em;
    color: var(--ax-color-text-secondary);
    font-size: 1.02rem;
    line-height: 1.75;
}

.caso-body :deep(h3) {
    margin: 2.4em 0 0.8em;
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--ax-color-text-primary);
}

.caso-body :deep(h4) {
    margin: 2em 0 0.7em;
    font-size: 1.12rem;
    font-weight: 600;
}

.caso-body :deep(ul),
.caso-body :deep(ol) {
    margin: 0 0 1.6em;
    padding-left: 1.3em;
    color: var(--ax-color-text-secondary);
    line-height: 1.7;
}

.caso-body :deep(li) {
    margin-bottom: 0.6em;
}

.caso-body :deep(b),
.caso-body :deep(strong) {
    color: var(--ax-color-text-primary);
    font-weight: 600;
}

.caso-body :deep(a) {
    color: var(--ax-color-accent-red-soft);
}

.caso-back {
    display: inline-block;
    margin-top: 56px;
}

@media (max-width: 640px) {
    .caso-page {
        padding: 14vh 5vw 10vh;
    }

    .caso-cover {
        margin-bottom: 28px;
    }
}
</style>