<template>
    <section class="cms-cta" :class="`is-${value.style || 'primary'}`">
        <h2 v-html="unwrapParagraph(value.heading)"></h2>
        <div v-if="value.body" class="body" v-html="value.body"></div>
        <NuxtLink
            v-if="isInternal"
            class="cta-button"
            :to="localePath(value.button_url)"
        ><span v-html="unwrapParagraph(value.button_label)"></span></NuxtLink>
        <a
            v-else
            class="cta-button"
            :href="value.button_url"
            target="_blank"
            rel="noopener noreferrer"
        ><span v-html="unwrapParagraph(value.button_label)"></span></a>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

const localePath = useLocalePath();

const props = defineProps<{
    value: {
        heading: string;
        body?: string;
        button_label: string;
        button_url: string;
        style?: "primary" | "subtle";
    };
}>();

// Internal links navigate inside the app instead of reloading the page.
const isInternal = computed(() => {
    const url = props.value.button_url || "";
    return url.startsWith("/") && !url.startsWith("//");
});
</script>

<style scoped>
/* A solid dark panel, so the block reads the same on the dark homepage
   and on the light inner pages (the old translucent gradient turned
   muddy pink on white, with pale red button text). */
.cms-cta {
    max-width: 900px;
    margin: 64px auto;
    padding: 52px clamp(24px, 6vw, 72px);
    text-align: center;
    border-radius: var(--ax-card-radius);
    color: #f2f8ff;
}

.is-primary {
    background:
        radial-gradient(circle at 85% 0%, rgba(234, 63, 48, 0.28), transparent 55%),
        linear-gradient(160deg, #0b1a2b 0%, #050d18 100%);
    box-shadow: 0 24px 50px rgba(5, 13, 24, 0.22);
}

.is-subtle {
    background: #0b1a2b;
    border: 1px solid rgba(147, 183, 218, 0.22);
}

/* Doubled class: light pages style every h2/p inside their body
   (e.g. .topic-body :deep(h2)); this panel is always dark. */
.cms-cta.cms-cta h2 {
    margin: 0 0 14px;
    color: #ffffff;
    font-size: clamp(1.5rem, 3vw, 2.2rem);
    font-weight: 300;
}

.cms-cta.cms-cta .body :deep(p) {
    max-width: 56ch;
    margin: 0 auto 28px;
    color: #c6dcef;
    line-height: 1.6;
}

.cta-button {
    display: inline-flex;
    align-items: center;
    min-height: 48px;
    padding: 0 26px;
    border-radius: 999px;
    color: #ffffff;
    background: var(--ax-color-accent-red, #c52317);
    font-size: 0.86rem;
    font-weight: 650;
    letter-spacing: 0.03em;
    text-decoration: none;
    transition: background-color 0.2s ease;
}

.cta-button:hover {
    background: var(--ax-color-accent-red-soft, #ea3f30);
}

.cta-button:focus-visible {
    outline: 2px solid #8bd9ff;
    outline-offset: 3px;
}

.cta-button :deep(p) {
    margin: 0;
}
</style>
