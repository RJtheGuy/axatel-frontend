<template>
    <section
        class="cms-features text-center"
        :class="{ 'center-heading': value.center_heading, 'center-items': value.center_items }"
    >
        <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>
        <div v-if="value.subheading" class="sub" v-html="value.subheading"></div>

        <div class="grid" :class="`cols-${value.columns || 'auto'}`">
            <div
                v-for="(f, i) in features"
                :key="i"
                class="feature text-center"
                :class="`w-${f.width || 'normal'}`"
            >
                <img v-if="f.icon?.url" class="icon" :src="imageUrl(f.icon.url)" alt="" width="100" height="100" loading="lazy" />
                <h3 v-html="unwrapParagraph(f.title)"></h3>
                <!-- The description is optional: no element at all when it is empty. -->
                <div v-if="hasText(f.description)" class="description" v-html="f.description"></div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

const { imageUrl } = useCmsImage();

type Feature = {
    icon?: { url: string } | null;
    title: string;
    description?: string | null;
    width?: "normal" | "wide" | "full";
};

const props = defineProps<{
    value: {
        heading?: string;
        subheading?: string;
        center_heading?: boolean;
        center_items?: boolean;
        columns?: "auto" | "2" | "3" | "4" | "6";
        features?: Feature[];
    };
}>();

const features = computed<Feature[]>(() => props.value.features ?? []);

// An "empty" rich text can still come back as <p></p>, so check the visible text.
function hasText(html?: string | null): boolean {
    return !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;
}
</script>

<style scoped>
.cms-features {
    padding: 0px;
}

h2 {
    margin: 0 0 12px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 300;
}

.sub :deep(p) {
    max-width: 680px;
    margin: 0 0 38px;
    color: var(--cms-text, var(--ax-color-text-primary));
    line-height: 1.6;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 30px;
}

/* Cards per row chosen by the editor ("auto" keeps the original behaviour). */
.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.cols-6 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
}

/* Width chosen by the editor for each item. */
.w-wide {
    grid-column: span 2;
}

.w-full {
    grid-column: 1 / -1;
}

.icon {
    display: block;
    width: 100px;
    height: 100px;
    object-fit: contain;
    margin-bottom: 14px;
}

h3 {
    margin: 0 0 8px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: 1.04rem;
    font-weight: 600;
}

.feature .description :deep(p) {
    margin: 0;
    color: var(--cms-text, var(--ax-color-text-primary));
    font-size: 0.94rem;
    line-height: 1.55;
}

/* Optional centering, controlled from the CMS. */
.center-heading h2,
.center-heading .sub {
    text-align: center;
}

.center-heading .sub :deep(p) {
    margin-right: auto;
    margin-left: auto;
}

.center-items .feature {
    text-align: center;
}

.center-items .icon {
    margin-right: auto;
    margin-left: auto;
}

/* Fewer columns on smaller screens so the text stays readable. */
@media (max-width: 1024px) {
    .cols-6 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .cols-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 900px) {
    .cols-3 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .cms-features {
        padding: 0px;
    }

    .cols-2,
    .cols-3,
    .cols-4,
    .cols-6 {
        grid-template-columns: minmax(0, 1fr);
    }

    .w-wide {
        grid-column: auto;
    }
}
.text-center {
    text-align: center;
}
</style>
