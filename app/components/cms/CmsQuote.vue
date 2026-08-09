<template>
    <blockquote class="cms-quote">
        <div class="quote-text" v-html="value.quote"></div>
        <cite v-if="value.attribution" v-html="unwrapParagraph(value.attribution)"></cite>
    </blockquote>
</template>

<script setup lang="ts">
import { unwrapParagraph } from "~/composables/richtext";

defineProps<{ value: { quote: string; attribution?: string } }>();
</script>

<style scoped>
.cms-quote {
    max-width: 820px;
    margin: 56px auto;
    padding: 0 8vw;
    border-left: 2px solid var(--ax-color-accent-red-soft);
}

.quote-text :deep(p) {
    margin: 0 0 14px;
    font-size: clamp(1.15rem, 2.2vw, 1.6rem);
    font-weight: 300;
    line-height: 1.45;
    color: var(--ax-color-text-primary);
}

cite {
    color: var(--ax-color-text-muted);
    font-size: 0.9rem;
    font-style: normal;
}
</style>
