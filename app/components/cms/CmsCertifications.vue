<template>
    <section v-if="items.length" class="cms-certs" :style="{ '--per': per }">
        <div v-if="hasText(value.heading)" class="head">
            <h2 v-html="unwrapParagraph(value.heading)"></h2>
            <span class="bar" aria-hidden="true"></span>
        </div>

        <!-- "Certificati visibili insieme" from the CMS (default 3). When there are
             more, the arrows scroll the row both ways, wrapping at the ends;
             on touch screens the row can also be swiped. -->
        <div class="carousel" :class="{ scrolls: canScroll }">
            <button
                v-show="canScroll"
                type="button"
                class="arrow prev"
                :aria-label="labels.prev"
                :aria-controls="trackId"
                @click="go(-1)"
            >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>

            <ul :id="trackId" ref="track" class="track" :aria-label="plain(value.heading) || labels.region">
                <li v-for="(item, i) in items" :key="i">
                    <!-- With a PDF the whole card (logo, name, text) is the link, always
                         in a new tab: the browser shows the certificate with its download
                         button. No separate button inside the card. -->
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
                        <span v-if="item.document?.url" class="sr-only">{{ labels.open }}</span>
                    </component>
                </li>
            </ul>

            <button
                v-show="canScroll"
                type="button"
                class="arrow next"
                :aria-label="labels.next"
                :aria-controls="trackId"
                @click="go(1)"
            >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Certificazioni": a row showing N certificates at a time (CMS: "Certificati
// visibili insieme", default 3). With more certificates than fit, arrows on both
// sides scroll one card at a time and wrap around at the ends.
// Each card: logo on top, name, optional text, optional PDF. With a PDF the whole
// card opens it in a new tab (always, whatever the "Link ai documenti" setting);
// screen readers also hear "PDF, new tab".
// Colours follow the page (--cms-* on light pages, site colours on dark ones).
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
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
        columns?: string | null;
        items?: Certification[];
    };
}>();

const { locale } = useI18n();
const TEXT: Record<string, { open: string; prev: string; next: string; region: string }> = {
    it: { open: "(certificato PDF, si apre in una nuova scheda)", prev: "Certificati precedenti", next: "Certificati successivi", region: "Certificazioni" },
    en: { open: "(PDF certificate, opens in a new tab)", prev: "Previous certificates", next: "Next certificates", region: "Certifications" },
    fr: { open: "(certificat PDF, s'ouvre dans un nouvel onglet)", prev: "Certificats précédents", next: "Certificats suivants", region: "Certifications" },
};
const labels = computed(() => TEXT[locale.value] ?? TEXT.it!);

const items = computed<Certification[]>(() => (props.value.items ?? []).filter(Boolean));
const anyLogo = computed(() => items.value.some((item) => !!item.logo?.url));

// How many are visible at once on a wide screen (1-5; anything else: 3).
const per = computed(() => {
    const n = Number(props.value.columns);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 3;
});

const trackId = `certs-${useId()}`;
const track = ref<HTMLElement | null>(null);

// Before the page runs in the browser: arrows if there are more than fit on a
// wide screen. Afterwards: measured, so phones (fewer per row) get them too.
const measured = ref<boolean | null>(null);
const canScroll = computed(() => measured.value ?? items.value.length > per.value);

function measure() {
    const el = track.value;
    if (el) measured.value = el.scrollWidth - el.clientWidth > 2;
}

function go(direction: 1 | -1) {
    const el = track.value;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card.getBoundingClientRect().width + gap;
    const end = el.scrollWidth - el.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";

    // Wrap around: past the last card back to the first, and the other way.
    if (direction > 0 && el.scrollLeft >= end - 2) el.scrollTo({ left: 0, behavior });
    else if (direction < 0 && el.scrollLeft <= 2) el.scrollTo({ left: end, behavior });
    else el.scrollBy({ left: direction * step, behavior });
}

let observer: ResizeObserver | null = null;
onMounted(() => {
    measure();
    if (typeof ResizeObserver !== "undefined" && track.value) {
        observer = new ResizeObserver(measure);
        observer.observe(track.value);
    }
});
onBeforeUnmount(() => observer?.disconnect());

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
    --gap: 24px;
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

/* Arrow | row | arrow. Without arrows the row takes the full width. */
.carousel {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    gap: 12px;
}

.carousel.scrolls {
    grid-template-columns: auto minmax(0, 1fr) auto;
}

/* One row; each card is exactly 1/N of the row. Extra cards sit to the
   right and scroll into view; the row snaps to whole cards. */
.track {
    --shown: min(var(--per), var(--max-per, 5));
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: calc((100% - (var(--shown) - 1) * var(--gap)) / var(--shown));
    gap: var(--gap);
    margin: 0;
    padding: 4px 2px 8px;
    list-style: none;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
}

.track::-webkit-scrollbar {
    display: none;
}

/* Fewer certificates than places: centre them instead of leaving a gap. */
.carousel:not(.scrolls) .track {
    justify-content: center;
}

.track > li {
    display: flex;
    min-width: 0;
    scroll-snap-align: start;
}

.arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    padding: 0;
    border: 1px solid var(--cms-border, rgba(127, 127, 127, 0.35));
    border-radius: 50%;
    background: transparent;
    color: var(--cms-heading, var(--ax-color-text-primary));
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.arrow:hover,
.arrow:focus-visible {
    border-color: var(--ax-color-accent-red, #c52317);
    background: var(--ax-color-accent-red, #c52317);
    color: #fff;
}

.arrow:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft, #ea3f30);
    outline-offset: 2px;
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
    outline-offset: -2px;
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

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
    .cert,
    .arrow {
        transition: none;
    }

    .is-link:hover,
    .is-link:focus-visible {
        transform: none;
    }
}

/* Fewer at a time on smaller screens so the text stays readable. */
@media (max-width: 1100px) {
    .track {
        --max-per: 3;
    }
}

@media (max-width: 900px) {
    .track {
        --max-per: 2;
    }
}

@media (max-width: 600px) {
    .cms-certs {
        --gap: 12px;
    }

    .track {
        --max-per: 1;
    }

    .carousel {
        gap: 6px;
    }

    .arrow {
        width: 36px;
        height: 36px;
    }
}
</style>
