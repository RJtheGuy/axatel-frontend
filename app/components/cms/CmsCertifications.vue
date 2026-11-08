<template>
    <section v-if="items.length" class="cms-certs">
        <div v-if="hasText(value.heading)" class="head">
            <h2 v-html="unwrapParagraph(value.heading)"></h2>
            <span class="bar" aria-hidden="true"></span>
        </div>

        <!-- "Certificati per riga" from the CMS; extra ones wrap to the next row. -->
        <div class="grid" :class="`cols-${value.columns || '3'}`">
            <component
                :is="item.document?.url ? 'a' : 'div'"
                v-for="(item, i) in items"
                :key="i"
                class="cert"
                :class="{ 'is-link': item.document?.url }"
                :href="item.document?.url || undefined"
                :target="item.document?.url && newTab ? '_blank' : undefined"
                :rel="item.document?.url && newTab ? 'noopener' : undefined"
            >
                <div v-if="item.logo?.url" class="logo">
                    <ContentResponsiveImage :src="item.logo.url" alt="" width="140" height="80" sizes="140px" />
                </div>
                <div class="body">
                    <h3 v-html="unwrapParagraph(item.title)"></h3>
                    <div v-if="hasText(item.text)" class="text" v-html="item.text"></div>
                </div>
            </component>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Certificazioni": any number of certificates, a fixed number per row.
// Each one: logo, name, optional text, optional PDF (the whole card opens it).
// Colours follow the page (--cms-* on light pages, site colours on dark ones).
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

type Certification = {
    logo?: { url: string } | null;
    title: string;
    text?: string | null;
    document?: { url: string; title?: string } | null;
};

const props = defineProps<{
    value: {
        heading?: string | null;
        columns?: "1" | "2" | "3" | "4";
        items?: Certification[];
    };
}>();

const items = computed<Certification[]>(() => (props.value.items ?? []).filter(Boolean));
const { newTab } = useDocumentLinks();

function hasText(html?: string | null): boolean {
    return !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;
}
</script>

<style scoped>
.cms-certs {
    /* Same width rule as "Card pagine": the page's width on light pages,
       1100px centred on the dark full-width ones. */
    max-width: var(--cms-wide, 1100px);
    margin: 0 auto;
    padding: 56px 0;
}

.head {
    margin-bottom: 40px;
    text-align: center;
}

h2 {
    margin: 0;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.3rem, 2.4vw, 1.8rem);
    font-weight: 400;
    letter-spacing: 0.06em;
}

.bar {
    display: block;
    width: 72px;
    height: 3px;
    margin: 18px auto 0;
    border-radius: 2px;
    background: var(--ax-color-accent-red, #c52317);
}

.grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px 36px;
}

.cols-1 {
    grid-template-columns: minmax(0, 1fr);
}

.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.cert {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    min-width: 0;
    color: inherit;
    text-decoration: none;
}

.logo {
    flex: 0 0 auto;
    width: 120px;
}

.logo :deep(img) {
    display: block;
    width: 100%;
    height: auto;
    max-height: 90px;
    object-fit: contain;
    object-position: left top;
}

.body {
    min-width: 0;
}

h3 {
    margin: 0 0 6px;
    color: var(--ax-color-accent-red-soft, #ea3f30);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.35;
}

.text :deep(p) {
    margin: 0;
    color: var(--cms-text, var(--ax-color-text-secondary));
    font-size: 0.93rem;
    line-height: 1.55;
}

.is-link h3 {
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition: text-decoration-color 0.18s ease;
}

.is-link:hover h3,
.is-link:focus-visible h3 {
    text-decoration-color: currentColor;
}

/* Fewer per row on smaller screens so the text stays readable. */
@media (max-width: 1100px) {
    .cols-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 900px) {
    .grid:not(.cols-1) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 600px) {
    .grid:not(.cols-1) {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
