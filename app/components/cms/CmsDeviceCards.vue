<template>
    <section v-if="value.items?.length" class="cms-cards">
        <h2>{{ value.heading }}</h2>
        <div class="grid">
            <NuxtLink v-for="item in value.items" :key="item.url" :to="localePath(item.url)" class="card">
                <span class="media" aria-hidden="true">
                    <ContentResponsiveImage v-if="item.image" :src="item.image.url" :width="72" :height="72" sizes="72px" />
                </span>
                <span class="body">
                    <strong>{{ item.title }}</strong>
                    <small v-if="item.model_code">{{ item.model_code }}</small>
                    <span v-if="item.tagline" class="text">{{ item.tagline }}</span>
                    <span class="more">{{ t("products.viewProduct") }} <span aria-hidden="true">→</span></span>
                </span>
            </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Schede dispositivi": cards linking to product pages.
defineProps<{
    value: { heading: string; items: Array<{ title: string; url: string; model_code?: string; tagline?: string; image?: { url: string } | null }> };
}>();
const { t } = useI18n();
const localePath = useLocalePath();
</script>

<style scoped>
.cms-cards {
    max-width: var(--cms-wide, 1000px);
    margin: 0 auto;
    padding: 28px 0;
    border-top: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
}

h2 {
    max-width: var(--cms-measure, 760px);
    margin: 0 auto 18px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.card {
    /* main.scss has an old global .card (190×254 px, grey shadow) for the
       demo cards: without these three lines the CMS cards inherit it. */
    width: auto;
    height: auto;
    box-shadow: none;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    padding: 18px;
    border: 1px solid var(--cms-border, rgba(147, 183, 218, 0.22));
    border-radius: 14px;
    background: var(--cms-surface, rgba(12, 29, 45, 0.5));
    text-decoration: none;
    transition: border-color 0.2s ease, transform 0.2s ease;
}

.card:hover {
    border-color: rgba(197, 35, 23, 0.45);
    transform: translateY(-2px);
}

.card:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft, #ea3f30);
    outline-offset: 3px;
}

.media {
    flex: 0 0 64px;
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #f1f5f9;
}

.media img {
    width: 54px;
    height: 54px;
    object-fit: contain;
}

.body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

strong {
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: 1.02rem;
}

small {
    color: var(--cms-text, var(--ax-color-text-muted));
    font-size: 0.74rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.text {
    color: var(--cms-text, var(--ax-color-text-secondary));
    font-size: 0.9rem;
    line-height: 1.5;
}

.more {
    margin-top: 4px;
    color: var(--ax-color-accent-red-soft, #c52317);
    font-size: 0.82rem;
    font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
    .card, .card:hover { transition: none; transform: none; }
}
</style>
