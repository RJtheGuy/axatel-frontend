<template>
    <!-- Full-width band (like a page banner) even when the page text is narrow,
         so three certificates fit with the logo beside the text. -->
    <section v-if="items.length" ref="band" class="cms-certs-band" :style="bandStyle">
        <div class="cms-certs" :style="{ '--per': per }">
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

                <ul :id="trackId" ref="track" class="track" :aria-label="plain(value.heading) || labels.region" @scroll.passive="onScroll">
                    <li v-for="(item, i) in items" :key="i">
                        <!-- With a PDF or an external link the whole card (logo, name, text)
                             is the link, always in a new tab: for a PDF the browser shows the
                             certificate with its download button. The PDF wins if both are set. -->
                        <component
                            :is="hrefOf(item) ? 'a' : 'div'"
                            class="cert"
                            :class="{ 'is-link': !!hrefOf(item) }"
                            :href="hrefOf(item) || undefined"
                            :target="hrefOf(item) ? '_blank' : undefined"
                            :rel="hrefOf(item) ? 'noopener' : undefined"
                        >
                            <!-- Logo on the left, name and text on the right (stacked when the
                                 card is narrow). Same logo box on every card, so the names line up. -->
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
                            <div class="body">
                                <h3 v-html="unwrapParagraph(item.title)"></h3>
                                <div v-if="hasText(item.text)" class="text" v-html="item.text"></div>
                                <span v-if="item.document?.url" class="sr-only">{{ labels.open }}</span>
                                <span v-else-if="hrefOf(item)" class="sr-only">{{ labels.openLink }}</span>
                            </div>
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

            <!-- One dot per group of visible certificates; the current group is highlighted. -->
            <div v-if="canScroll && pageCount > 1" class="dots">
                <button
                    v-for="p in pageCount"
                    :key="p"
                    type="button"
                    class="dot"
                    :class="{ active: p - 1 === page }"
                    :aria-label="`${labels.page} ${p} / ${pageCount}`"
                    :aria-current="p - 1 === page ? 'true' : undefined"
                    :aria-controls="trackId"
                    @click="goTo(p - 1)"
                ></button>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Certificazioni": a row showing N certificates at a time (CMS: "Certificati
// visibili insieme", default 3). With more certificates than fit, arrows on both
// sides scroll one card at a time and wrap around at the ends.
// Each card: logo on the left, name and optional text on the right, optional PDF
// or external link ("Link esterno", update 78).
// Dots under the row show which group of certificates is visible and jump to it.
// With a PDF the whole card opens it in a new tab (always, whatever the "Link ai documenti" setting);
// screen readers also hear "PDF, new tab".
// Colours follow the page (--cms-* on light pages, site colours on dark ones).
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

type Certification = {
    logo?: { url: string } | null;
    title: string;
    text?: string | null;
    document?: { url: string; title?: string } | null;
    link?: string | null;
};

const props = defineProps<{
    value: {
        heading?: string | null;
        columns?: string | null;
        items?: Certification[];
    };
}>();

const { locale } = useI18n();
const TEXT: Record<string, { open: string; openLink: string; prev: string; next: string; region: string; page: string }> = {
    it: { open: "(certificato PDF, si apre in una nuova scheda)", openLink: "(si apre in una nuova scheda)", prev: "Certificati precedenti", next: "Certificati successivi", region: "Certificazioni", page: "Gruppo" },
    en: { open: "(PDF certificate, opens in a new tab)", openLink: "(opens in a new tab)", prev: "Previous certificates", next: "Next certificates", region: "Certifications", page: "Group" },
    fr: { open: "(certificat PDF, s'ouvre dans un nouvel onglet)", openLink: "(s'ouvre dans un nouvel onglet)", prev: "Certificats précédents", next: "Certificats suivants", region: "Certifications", page: "Groupe" },
};
const labels = computed(() => TEXT[locale.value] ?? TEXT.it!);

const items = computed<Certification[]>(() => (props.value.items ?? []).filter(Boolean));
// Where a click on the card goes: the PDF, else the external link (http/https only).
function hrefOf(item: Certification): string {
    if (item.document?.url) return item.document.url;
    const link = String(item.link ?? "").trim();
    return /^https?:\/\//i.test(link) ? link : "";
}

const anyLogo = computed(() => items.value.some((item) => !!item.logo?.url));

// How many are visible at once on a wide screen (1-5; anything else: 3).
const per = computed(() => {
    const n = Number(props.value.columns);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : 3;
});

const trackId = `certs-${useId()}`;
const track = ref<HTMLElement | null>(null);

// Full-width band: in the browser the band is stretched exactly from the left to
// the right edge of the window (scrollbar excluded), whatever column it sits in.
// Before that, CSS does the same approximately (100vw, centred).
const band = ref<HTMLElement | null>(null);
const bleed = ref<{ left: number; width: number } | null>(null);
const bandStyle = computed(() =>
    bleed.value ? { marginLeft: `${-bleed.value.left}px`, width: `${bleed.value.width}px` } : undefined,
);

function measureBand() {
    const el = band.value;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const cs = getComputedStyle(parent);
    const left = parent.getBoundingClientRect().left + (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.borderLeftWidth) || 0);
    bleed.value = { left, width: document.documentElement.clientWidth };
}

// Before the page runs in the browser: arrows if there are more than fit on a
// wide screen. Afterwards: measured, so phones (fewer per row) get them too.
const measured = ref<boolean | null>(null);
const canScroll = computed(() => measured.value ?? items.value.length > per.value);

// Dots: how many cards fit (measured in the browser, the CMS value before that)
// and which group is in view.
const shown = ref<number | null>(null);
const step = ref(0);
const page = ref(0);
const shownNow = computed(() => shown.value ?? per.value);
const pageCount = computed(() => Math.max(1, Math.ceil(items.value.length / shownNow.value)));

function measure() {
    const el = track.value;
    if (!el) return;
    measured.value = el.scrollWidth - el.clientWidth > 2;
    const card = el.querySelector("li");
    if (card) {
        const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
        step.value = card.getBoundingClientRect().width + gap;
        if (step.value > 0) shown.value = Math.max(1, Math.round((el.clientWidth + gap) / step.value));
    }
    onScroll();
}

function onScroll() {
    const el = track.value;
    if (!el || !step.value) return;
    const last = pageCount.value - 1;
    const end = el.scrollWidth - el.clientWidth;
    page.value = el.scrollLeft >= end - 2 ? last : Math.min(last, Math.round(el.scrollLeft / (shownNow.value * step.value)));
}

function goTo(p: number) {
    const el = track.value;
    if (!el || !step.value) return;
    const end = el.scrollWidth - el.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: Math.min(p * shownNow.value * step.value, end), behavior: reduce ? "auto" : "smooth" });
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
let pageObserver: ResizeObserver | null = null;
onMounted(() => {
    measureBand();
    measure();
    if (typeof ResizeObserver !== "undefined") {
        if (track.value) {
            observer = new ResizeObserver(measure);
            observer.observe(track.value);
        }
        // window resized, scrollbar appearing, sidebar opening…: band follows
        pageObserver = new ResizeObserver(measureBand);
        pageObserver.observe(document.documentElement);
        if (band.value?.parentElement) pageObserver.observe(band.value.parentElement);
    }
});
onBeforeUnmount(() => {
    observer?.disconnect();
    pageObserver?.disconnect();
});

function plain(html?: string | null): string {
    return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function hasText(html?: string | null): boolean {
    return plain(html).length > 0;
}
</script>

<style scoped>
/* Band across the whole window; light grey so the section reads as its own strip. */
.cms-certs-band {
    box-sizing: border-box;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    padding: 0 clamp(16px, 3vw, 40px);
    background: var(--cms-certs-band, rgba(127, 127, 127, 0.07));
}

.cms-certs {
    --gap: 24px;
    max-width: 1320px;
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
    letter-spacing: 0.12em;
    text-transform: uppercase;
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
    gap: 24px;
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
    position: relative; /* keeps the hidden screen-reader text of off-screen cards inside
                           the row; without it the page could scroll sideways on phones */
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
    container-type: inline-size; /* the card's own width decides beside / stacked */
}

/* Large round grey arrows, red on hover. */
.arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 50%;
    background: var(--cms-arrow-bg, rgba(110, 110, 110, 0.85));
    color: #fff;
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

.arrow svg {
    width: 26px;
    height: 26px;
}

/* Card: logo on the left, name and text beside it; equal height in a row. */
.cert {
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
    min-width: 0;
    padding: 18px 16px;
    border: 1px solid transparent;
    border-radius: 12px;
    color: inherit;
    text-align: left;
    text-decoration: none;
    transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.logo {
    display: flex;
    flex: 0 0 clamp(96px, 38%, 140px);
    align-items: flex-start; /* top of the logo in line with the name */
    justify-content: flex-start;
    height: 80px;
}

.logo :deep(img) {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 80px;
    object-fit: contain;
}

.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding-top: 17px;
}

h3 {
    margin: 0;
    color: var(--ax-color-accent-red-soft, #ea3f30);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    line-height: 1.3;
    overflow-wrap: break-word;
    /* a long name: at most 2 lines */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
}

/* A long description is cut after 4 lines, so one card can't make the whole
   row tall. The full text stays in the CMS (and in the page for search engines). */
.text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    overflow: hidden;
}

.text :deep(p) {
    margin: 0;
    color: var(--cms-text, var(--ax-color-text-secondary));
    font-size: 0.98rem;
    line-height: 1.6;
}

/* Narrow card (phones, or many cards per row): logo on top, all centred. */
@container (max-width: 260px) {
    .cert {
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .logo {
        flex-basis: auto;
        width: 100%;
        align-items: center;
        justify-content: center;
    }
}

/* Dots under the row. */
.dots {
    display: flex;
    justify-content: center;
    gap: 14px;
    margin-top: 32px;
}

.dot {
    width: 12px;
    height: 12px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--cms-border, rgba(127, 127, 127, 0.3));
    cursor: pointer;
    transition: background-color 0.2s ease, transform 0.2s ease;
}

.dot.active {
    background: var(--cms-text, var(--ax-color-text-secondary, #6b6b6b));
    transform: scale(1.1);
}

.dot:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft, #ea3f30);
    outline-offset: 3px;
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
    .arrow,
    .dot {
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
        width: 40px;
        height: 40px;
    }

    .arrow svg {
        width: 20px;
        height: 20px;
    }
}
</style>