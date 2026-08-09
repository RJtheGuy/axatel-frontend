<template>
    <figure v-if="value.image?.url" class="cms-image">
        <img
            :src="value.image.url"
            :alt="value.alt_text || value.image.alt || ''"
            :width="value.image.width"
            :height="value.image.height"
            loading="lazy"
            decoding="async"
        />
        <figcaption v-if="value.caption" v-html="value.caption"></figcaption>
    </figure>
</template>

<script setup lang="ts">
defineProps<{
    value: {
        image?: { url: string; alt?: string; width?: number; height?: number };
        caption?: string;
        // alt_text is an accessibility attribute, not display text -
        // it stayed a plain CharBlock on the Django side on purpose
        // (see core/blocks.py) and is used directly as :alt above,
        // never through v-html.
        alt_text?: string;
    };
}>();
</script>

<style scoped>
.cms-image {
    max-width: 1000px;
    margin: 48px auto;
    padding: 0 8vw;
}

.cms-image img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: var(--ax-card-radius);
    border: 1px solid var(--ax-color-border-soft);
}

figcaption {
    margin-top: 12px;
    color: var(--ax-color-text-muted);
    font-size: 0.86rem;
    text-align: center;
}

figcaption :deep(p) {
    margin: 0;
}
</style>
