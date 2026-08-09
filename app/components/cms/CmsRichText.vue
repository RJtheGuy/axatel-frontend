<template>
    <!-- The block value is pre-rendered HTML from Wagtail's
         RichTextBlock. v-html is correct: content is authored by trusted
         staff in the CMS admin, not user-submitted. Do NOT change this
         to {{ }} — it would print escaped tags as literal text. -->
    <div class="cms-rich-text" v-html="value"></div>
</template>

<script setup lang="ts">
defineProps<{ value: string }>();
</script>

<style scoped>
.cms-rich-text {
    max-width: 820px;
    margin: 0 auto;
    padding: 40px 8vw;
}

.cms-rich-text :deep(p) {
    margin: 0 0 1.4em;
    color: var(--ax-color-text-secondary);
    line-height: 1.75;
}

.cms-rich-text :deep(h2) {
    margin: 2em 0 0.7em;
    font-size: 1.7rem;
    font-weight: 300;
}

.cms-rich-text :deep(h3) {
    margin: 1.8em 0 0.6em;
    font-size: 1.32rem;
    font-weight: 600;
}

.cms-rich-text :deep(h4) {
    margin: 1.6em 0 0.5em;
    font-size: 1.1rem;
    font-weight: 600;
}

.cms-rich-text :deep(ul),
.cms-rich-text :deep(ol) {
    margin: 0 0 1.5em;
    padding-left: 1.3em;
    color: var(--ax-color-text-secondary);
    line-height: 1.7;
}

.cms-rich-text :deep(li) {
    margin-bottom: 0.5em;
}

.cms-rich-text :deep(a) {
    color: var(--ax-color-accent-red-soft);
}

.cms-rich-text :deep(b),
.cms-rich-text :deep(strong) {
    color: var(--ax-color-text-primary);
    font-weight: 600;
}
</style>
