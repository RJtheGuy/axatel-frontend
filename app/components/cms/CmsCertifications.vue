<template>
    <section v-if="items.length" class="cms-certs">
        <div v-if="hasText(value.heading)" class="head">
            <h2 v-html="unwrapParagraph(value.heading)"></h2>
            <span class="bar" aria-hidden="true"></span>
        </div>

        <!-- "Certificati per riga" from the CMS; extra ones wrap to the next row. -->
        <ul class="grid" :class="`cols-${value.columns || '3'}`">
            <li v-for="(item, i) in items" :key="i">
                <!-- With a PDF the whole card is the link, always in a new tab:
                     the browser shows the certificate with its download button. -->
                <component
                    :is="item.document?.url ? 'a' : 'div'"
                    class="cert"
                    :class="{ 'is-link': !!item.document?.url }"
                    :href="item.document?.url || undefined"
                    :target="item.document?.url ? '_blank' : undefined"
                    :rel="item.document?.url ? 'noopener' : undefined"
                >
                    <!-- Same logo box on every card, so the names line up in a row. -->
                    <div v-if="anyLogo" class="logo">
                        <ContentResponsiveImage
                            v-if="item.logo?.url"
                            :src="item.logo.url"
                            :alt="plain(item.title)"
                            width="160"
                            height="90"
                            sizes="160px"
                        />
                    </div>
                    <h3 v-html="unwrapParagraph(item.title)"></h3>
                    <div v-if="hasText(item.text)" class="text" v-html="item.text"></div>
                    <span v-if="item.document?.url" class="open">
                        {{ labels.open }}
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                            <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                        <span class="sr-only">{{ labels.newTab }}</span>
                    </span>
                </component>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
// "Certificazioni": any number of certificates, a fixed number per row.
// Each one: logo on top, name, optional text, optional PDF.
// With a PDF the whole card opens it in a new tab (always, whatever the
// "Link ai documenti" setting), where it can be read and downloaded.
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

const { locale } = useI18n();
const TEXT: Record<string, { open: string; newTab: string }> = {
    it: { open: "Apri il certificato (PDF)", newTab: "si apre in una nuova scheda" },
    en: { open: "Open the certificate (PDF)", newTab: "opens in a new tab" },
    fr: { open: "Ouvrir le certificat (PDF)", newTab: "s'ouvre dans un nouvel onglet" },
};
const labels = computed(() => TEXT[locale.value] ?? TEXT.it!);

const items = computed<Certification[]>(() => (props.value.items ?? []).filter(Boolean));
const anyLogo = computed(() => items.value.some((item) => !!item.logo?.url));

function plain(html?: string | null): string {
    return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function hasText(html?: string | null): boolean {
    return plain(html).length > 0;
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
    gap: 24px;
    margin: 0;
    padding: 0;
    list-style: none;
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

.grid > li {
    display: flex;
    min-width: 0;
}

/* Card: logo, name and text stacked and centred; equal height in a row. */
.cert {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    padding: 26px 20px 22px;
    border: 1px solid transparent;
    border-radius: 12px;
    color: inherit;
    text-align: center;
    text-decoration: none;
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 90px;
    margin-bottom: 18px;
}

.logo :deep(img) {
    display: block;
    width: auto;
    height: auto;
    max-width: 160px;
    max-height: 90px;
    object-fit: contain;
}

h3 {
    margin: 0 0 8px;
    color: var(--ax-color-accent-red-soft, #ea3f30);
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.35;
    overflow-wrap: anywhere;
}

.text :deep(p) {
    margin: 0;
    color: var(--cms-text, var(--ax-color-text-secondary));
    font-size: 0.93rem;
    line-height: 1.55;
}

/* "Apri il certificato" sits at the bottom, so it lines up across a row. */
.open {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: auto;
    padding-top: 16px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: 0.85rem;
    font-weight: 500;
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition: text-decoration-color 0.18s ease;
}

.is-link {
    cursor: pointer;
}

.is-link:hover,
.is-link:focus-visible {
    border-color: var(--cms-border, rgba(127, 127, 127, 0.28));
    background: var(--cms-surface, rgba(127, 127, 127, 0.07));
    transform: translateY(-2px);
}

.is-link:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft, #ea3f30);
    outline-offset: 2px;
}

.is-link:hover .open,
.is-link:focus-visible .open {
    text-decoration-color: currentColor;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
    .cert {
        transition: none;
    }

    .is-link:hover,
    .is-link:focus-visible {
        transform: none;
    }
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
