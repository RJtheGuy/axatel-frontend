<template>
    <div v-if="value.document?.url" class="cms-download">
        <a :href="value.document.url" download>
            <span class="icon" aria-hidden="true">↓</span>
            <span v-if="value.label" v-html="unwrapParagraph(value.label)"></span>
            <span v-else>{{ value.document.title }}</span>
        </a>
    </div>
</template>

<script setup lang="ts">
import { unwrapParagraph } from "~/composables/richtext";

defineProps<{
    value: { document?: { url: string; title: string }; label?: string };
}>();
</script>

<style scoped>
.cms-download {
    max-width: 820px;
    margin: 28px auto;
    padding: 0 8vw;
}

a {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 14px 22px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: var(--ax-card-radius);
    background: rgba(7, 17, 29, 0.34);
    color: var(--ax-color-text-primary);
    text-decoration: none;
    transition: border-color 0.22s ease, background-color 0.22s ease;
}

a:hover {
    border-color: var(--ax-color-accent-red-border);
    background: rgba(234, 63, 48, 0.1);
}

.icon {
    color: var(--ax-color-accent-red-soft);
    font-weight: 700;
}
</style>
