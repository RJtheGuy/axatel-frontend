<template>
    <!-- A Servizio from the CMS (Pagine → Servizi), laid out like a success
         story: path, picture, category, title, description, tags, blocks. -->
    <main class="svc-detail">
        <article class="svc-container">
            <nav class="breadcrumb" :aria-label="t('caseDetail.breadcrumb')">
                <ol role="list">
                    <li><NuxtLink :to="localePath('/')">{{ t("caseDetail.home") }}</NuxtLink></li>
                    <li><NuxtLink :to="localePath('/servizi')">{{ t("services.title") }}</NuxtLink></li>
                    <li aria-current="page">{{ page.title }}</li>
                </ol>
            </nav>

            <!-- "Immagine nella pagina" = "Grande, in apertura": across the page. -->
            <ContentResponsiveImage
                v-if="cover && position === 'top'"
                class="svc-cover"
                :src="cover.url"
                :alt="cover.alt || page.title"
                :width="cover.width"
                :height="cover.height"
                sizes="100vw lg:1200px"
                loading="eager"
                fetchpriority="high"
            />

            <LayoutTranslationNotice v-if="page.__fallback" />

            <header class="svc-header" :class="{ 'has-media': sideImage }">
                <div>
                    <p v-if="page.category" class="svc-category">{{ page.category }}</p>
                    <h1>{{ page.title }}</h1>
                    <p v-if="page.short_description" class="svc-lead">{{ page.short_description }}</p>
                    <ContentMetaTags dark :tags="tags" />
                </div>
                <!-- "Accanto all'introduzione": next to title and description. -->
                <figure v-if="sideImage" class="svc-media">
                    <ContentResponsiveImage
                        :src="cover.url"
                        :alt="cover.alt || page.title"
                        :width="cover.width"
                        :height="cover.height"
                        sizes="100vw md:50vw lg:520px"
                        loading="eager"
                        fetchpriority="high"
                    />
                </figure>
            </header>

            <div v-if="blocks.length" class="svc-body">
                <CmsBlockRenderer :blocks="blocks" />
            </div>

            <ContentProjectCta v-if="!endsWithCta" :subject="page.title" />

            <NuxtLink class="svc-back ax-cta-outline" :to="localePath('/servizi')">{{ t("services.all") }}</NuxtLink>
        </article>
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { coverPosition, pageTags } from "../../utils/pageMeta";

const props = defineProps<{ page: any }>();

const { t } = useI18n();
const localePath = useLocalePath();

const cover = computed(() => (props.page?.cover_image?.url ? props.page.cover_image : null));
const position = computed(() => coverPosition(props.page));
const sideImage = computed(() => Boolean(cover.value) && position.value === "side");
const tags = computed(() => pageTags(props.page));
const blocks = computed(() => (props.page?.body ?? []) as Array<{ type: string }>);
// A call to action block at the end of the content already closes the page.
const endsWithCta = computed(() => blocks.value.length > 0 && blocks.value[blocks.value.length - 1]!.type === "cta");
</script>

<style scoped>
.svc-detail {
    min-height: 100vh;
    padding: 18vh 8vw 12vh;
}

.svc-container {
    max-width: 960px;
    margin: 0 auto;
}

.breadcrumb ol {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 32px;
    padding: 0;
    list-style: none;
    color: var(--ax-color-text-muted);
    font-size: 0.82rem;
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

.svc-cover {
    display: block;
    width: 100%;
    height: auto;
    max-height: 480px;
    margin-bottom: 40px;
    object-fit: cover;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: var(--ax-card-radius);
}

.svc-header {
    margin-bottom: 44px;
}

.svc-header.has-media {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 40%);
    gap: 40px;
    align-items: center;
}

.svc-category {
    margin: 0 0 12px;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.svc-header h1 {
    margin: 0 0 14px;
    font-size: clamp(1.9rem, 4vw, 3rem);
    font-weight: 300;
    line-height: 1.1;
}

.svc-lead {
    max-width: 62ch;
    margin: 0;
    color: var(--ax-color-text-secondary);
    font-size: 1.08rem;
    line-height: 1.65;
}

.svc-media {
    margin: 0;
}

.svc-media img {
    display: block;
    width: 100%;
    height: auto;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: var(--ax-card-radius);
}

/* CMS blocks fill this column instead of their own page widths. */
.svc-body {
    --cms-measure: 100%;
    --cms-wide: 100%;
}

.svc-body :deep(.cms-rich-text) {
    max-width: none;
    padding-right: 0;
    padding-left: 0;
}

.svc-back {
    margin-top: 48px;
}

@media (max-width: 768px) {
    .svc-detail {
        padding: 14vh 6vw 10vh;
    }

    .svc-header.has-media {
        grid-template-columns: 1fr;
        gap: 24px;
    }

    .svc-media {
        order: -1;
    }
}
</style>
