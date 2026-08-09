<template>
    <section class="cms-hero" :class="{ 'has-bg': value.background_image?.url }" :data-variant="value.variant || 'default'">
        <img
            v-if="value.background_image?.url"
            class="hero-bg"
            :src="value.background_image.url"
            :alt="value.background_image.alt || ''"
            decoding="async"
        />
        <div class="hero-inner">
            <h2 v-html="unwrapParagraph(value.heading)"></h2>
            <div v-if="value.subheading" class="subheading" v-html="value.subheading"></div>
            <a
                v-if="value.cta_label && value.cta_url"
                class="ax-cta-outline"
                :href="value.cta_url"
                v-html="unwrapParagraph(value.cta_label)"
            ></a>
        </div>
    </section>
</template>

<script setup lang="ts">
import { unwrapParagraph } from "~/composables/richtext";

defineProps<{
    value: {
        heading: string;
        subheading?: string;
        background_image?: { url: string; alt?: string };
        cta_label?: string;
        cta_url?: string;
        variant?: "default" | "accent" | "muted";
    };
}>();
</script>

<style scoped>
.cms-hero {
    position: relative;
    padding: 12vh 8vw;
    overflow: hidden;
}

.hero-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.32;
    z-index: 0;
}

.has-bg::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(2, 7, 18, 0.4), var(--ax-color-bg-main));
    z-index: 1;
}

.hero-inner {
    position: relative;
    z-index: 2;
    max-width: 820px;
}

.hero-inner h2 {
    margin: 0 0 18px;
    font-size: clamp(2rem, 4.6vw, 3.4rem);
    font-weight: 200;
    line-height: 1.08;
}

.hero-inner .subheading :deep(p) {
    margin: 0 0 28px;
    color: var(--ax-color-text-secondary);
    font-size: 1.08rem;
    line-height: 1.6;
}

/* Section variant - see "Stile della sezione" in the Wagtail admin.
   Every variant reads the SAME theme CSS variables the rest of the
   site already uses, so it stays in sync with whatever the active
   theme currently sets for accent/muted, rather than a hardcoded
   color of its own. */
.cms-hero[data-variant="accent"] .hero-inner h2 {
    color: var(--ax-color-accent-red-soft);
}

.cms-hero[data-variant="muted"] {
    opacity: 0.88;
}

.cms-hero[data-variant="muted"] .hero-inner h2 {
    color: var(--ax-color-text-secondary);
    font-weight: 300;
}
</style>
