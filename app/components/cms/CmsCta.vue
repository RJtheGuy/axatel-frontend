<template>
    <section class="cms-cta" :class="`is-${value.style || 'primary'}`">
        <h2 v-html="unwrapParagraph(value.heading)"></h2>
        <div v-if="value.body" class="body" v-html="value.body"></div>
        <a class="ax-cta-outline" :href="value.button_url" v-html="unwrapParagraph(value.button_label)"></a>
    </section>
</template>

<script setup lang="ts">
import { unwrapParagraph } from "~/composables/richtext";

defineProps<{
    value: {
        heading: string;
        body?: string;
        button_label: string;
        button_url: string;
        style?: "primary" | "subtle";
    };
}>();
</script>

<style scoped>
.cms-cta {
    max-width: 900px;
    margin: 64px auto;
    padding: 48px 8vw;
    text-align: center;
    border-radius: var(--ax-card-radius);
    border: 1px solid var(--ax-color-border-soft);
}

.is-primary {
    background: linear-gradient(140deg, rgba(234, 63, 48, 0.14), rgba(7, 17, 29, 0.5));
}

.is-subtle {
    background: rgba(7, 17, 29, 0.34);
}

h2 {
    margin: 0 0 14px;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 300;
}

.body :deep(p) {
    margin: 0 0 26px;
    color: var(--ax-color-text-secondary);
    line-height: 1.6;
}
</style>
