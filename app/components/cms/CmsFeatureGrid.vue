<template>
    <section class="cms-features">
        <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>
        <div v-if="value.subheading" class="sub" v-html="value.subheading"></div>

        <div class="grid">
            <div v-for="(f, i) in features" :key="i" class="feature">
                <img v-if="f.icon?.url" class="icon" :src="f.icon.url" alt="" width="40" height="40" loading="lazy" />
                <h3 v-html="unwrapParagraph(f.title)"></h3>
                <div class="description" v-html="f.description"></div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

type Feature = { icon?: { url: string }; title: string; description: string };

const props = defineProps<{
    value: { heading?: string; subheading?: string; features?: Feature[] };
}>();

const features = computed<Feature[]>(() => props.value.features ?? []);
</script>

<style scoped>
.cms-features {
    padding: 64px 8vw;
}

h2 {
    margin: 0 0 12px;
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 300;
}

.sub :deep(p) {
    max-width: 680px;
    margin: 0 0 38px;
    color: var(--ax-color-text-secondary);
    line-height: 1.6;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 30px;
}

.icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    margin-bottom: 14px;
}

h3 {
    margin: 0 0 8px;
    font-size: 1.04rem;
    font-weight: 600;
}

.feature .description :deep(p) {
    margin: 0;
    color: var(--ax-color-text-secondary);
    font-size: 0.94rem;
    line-height: 1.55;
}
</style>
