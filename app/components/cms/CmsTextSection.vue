<template>
    <section class="cms-text-section">
        <h2>{{ value.heading }}</h2>
        <div class="text" v-html="value.text"></div>
        <ul v-if="value.highlights?.length" class="highlights" role="list">
            <li v-for="item in value.highlights" :key="item">{{ item }}</li>
        </ul>
    </section>
</template>

<script setup lang="ts">
// "Sezione di testo": heading, paragraphs and short highlight pills.
// Colours follow the page: --cms-* variables are set by light pages.
defineProps<{ value: { heading: string; text: string; highlights?: string[] } }>();
</script>

<style scoped>
.cms-text-section {
    max-width: var(--cms-measure, 760px);
    margin: 0 auto;
    padding: 28px 0;
    border-top: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
}

h2 {
    margin: 0 0 14px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

.text :deep(p) {
    margin: 0 0 1em;
    color: var(--cms-text, var(--ax-color-text-secondary));
    line-height: 1.7;
}

.text :deep(a) {
    color: var(--ax-color-accent-red-soft);
}

.highlights {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
}

.highlights li {
    padding: 6px 12px;
    border: 1px solid rgba(234, 63, 48, 0.3);
    border-radius: 999px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: 0.8rem;
    font-weight: 600;
}
</style>
