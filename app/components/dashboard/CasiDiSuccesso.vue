<template>
    <section ref="sectionEl" class="casi-section">
        <div class="casi-overlay">
            <h2 class="kicker">{{ resolvedTitle }}</h2>
            <a class="casi-cta ax-cta-outline" :href="resolvedCtaHref">{{ resolvedCtaLabel }}</a>
        </div>

        <section ref="container" class="casi-applications">
            <div ref="track" class="casi-track">
                <NuxtLink
                    v-for="(item, index) in duplicatedCases"
                    :key="`${item.title}-${index}`"
                    class="case-card"
                    :to="buildArticleRoute(item)"
                    :aria-label="`Apri caso di successo: ${item.title}`"
                >
                    <div class="case-media">
                        <img
                            v-if="item.image"
                            :src="item.image"
                            :alt="item.title"
                            width="420"
                            height="236"
                            loading="lazy"
                            decoding="async"
                        />
                        <div v-else class="case-placeholder">{{ item.title }}</div>
                    </div>

                    <div class="case-body">
                        <h3>{{ item.title }}</h3>
                        <p>{{ item.description }}</p>
                    </div>
                </NuxtLink>
            </div>
        </section>
    </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
// useCarousel is auto-imported from ~/composables/carousel.
// The previous explicit `import { useCarousel } from "~/composables/carousel"`
// pinned this component to the old non-hover-pause implementation while
// the rest of the app auto-imported the _with_stop one. Both files have
// been merged into a single carousel.ts — see that file's header.

type SuccessCase = {
    title: string;
    description: string;
    image?: string;
    slug?: string;
    client?: string;
    category?: string;
    tags?: string[];
};

const props = defineProps<{
    title?: string;
    cases?: SuccessCase[];
    buttonLabel?: string;
    ctaLabel?: string;
    ctaHref?: string;
}>();

const sectionEl = ref<HTMLElement | null>(null);
const container = ref<HTMLElement | null>(null);
const track = ref<HTMLElement | null>(null);

let visibilityObserver: IntersectionObserver | null = null;
let carousel: ReturnType<typeof useCarousel> | null = null;

const defaultCases: SuccessCase[] = [
    {
        title: "Angel River",
        description: "Monitoraggio continuo dei livelli idrici con alert predittivi e interventi anticipati.",
        image: ""
    }
];

const resolvedTitle = computed(() => {
    const value = props.title?.trim();
    return value && value.length > 0 ? value : "Casi di successo";
});

const resolvedCases = computed(() => {
    if (props.cases && props.cases.length > 0) {
        return props.cases;
    }

    return defaultCases;
});

const resolvedCtaLabel = computed(() => {
    const value = props.ctaLabel?.trim();
    return value && value.length > 0 ? value : "Scopri tutti i progetti";
});

const resolvedCtaHref = computed(() => {
    const value = props.ctaHref?.trim();
    return value && value.length > 0 ? value : "#";
});

const duplicatedCases = computed(() => [...resolvedCases.value, ...resolvedCases.value]);

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
}

/**
 * Route to the case study page by slug.
 *
 * This used to JSON-stringify the entire case — including a multi-KB
 * HTML body — URI-encode it and pass it as a `payload` query param to
 * /articoli/<slug>. That broke on longer cases (URLs cap out somewhere
 * between 2k and 8k chars depending on browser and server), produced
 * unshareable URLs, and left the article page unindexable.
 *
 * The article page now fetches its own content from the CMS by slug,
 * so the link carries nothing but the slug.
 */
function buildArticleRoute(item: SuccessCase): string {
    const slug = item.slug && item.slug.length > 0 ? item.slug : slugify(item.title);
    return `/casi/${slug}`;
}

function emitCaseVisibility(active: boolean): void {
    window.dispatchEvent(
        new CustomEvent("axatel-case-visibility", {
            detail: { active }
        })
    );
}

onMounted(async () => {
    if (sectionEl.value) {
        visibilityObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry) return;

                const active = entry.isIntersecting && entry.intersectionRatio > 0.55;
                emitCaseVisibility(active);
            },
            {
                threshold: [0, 0.25, 0.55, 0.8, 1]
            }
        );

        visibilityObserver.observe(sectionEl.value);
    }

    await nextTick();

    if (!container.value || !track.value) return;

    carousel = useCarousel({
        container: container.value,
        track: track.value,
        speed: 0.85
    });
});

// Cases now arrive from the API, which means the track's width can
// change after the carousel has already measured it. The merged
// carousel has a ResizeObserver that catches this, but calling
// updateWidth() explicitly makes the recompute immediate rather than
// waiting a frame for the observer to fire.
watch(
    () => resolvedCases.value.length,
    async () => {
        await nextTick();
        carousel?.updateWidth();
    }
);

onUnmounted(() => {
    visibilityObserver?.disconnect();
    carousel?.destroy();
    emitCaseVisibility(false);
});
</script>

<style scoped>
.casi-section {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    overflow: hidden;
    background: transparent;
}

.casi-overlay {
    position: absolute;
    top: 10vh;
    left: 8vw;
    z-index: 1;
    pointer-events: none;
}

.kicker {
    margin: 0;
    color: var(--ax-color-text-primary);
    font-size: clamp(1.15rem, 2vw, 1.9rem);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 700;
    text-shadow: 0 8px 26px rgba(3, 14, 25, 0.6);
}

.casi-cta {
    margin-top: 14px;
    display: inline-block;
    pointer-events: auto;
    box-shadow: 0 10px 24px rgba(165, 27, 15, 0.22);
}

.casi-applications {
    position: relative;
    width: 100vw;
    height: 62vh;
    margin-left: calc(50% - 50vw);
    margin-top: 30vh;
    overflow: hidden;
    padding: 10px 8vw;
    user-select: none;
}

.casi-track {
    display: flex;
    align-items: center;
    gap: 34px;
    width: max-content;
    will-change: transform;
}

.case-card {
    position: relative;
    flex: 0 0 420px;
    height: min(50vh, 520px);
    display: grid;
    grid-template-rows: 58% 42%;
    overflow: hidden;
    border-radius: var(--ax-card-radius);
    border: 1px solid var(--ax-color-border-card);
    background: linear-gradient(180deg, rgba(249, 253, 255, 0.94), rgba(235, 243, 252, 0.92));
    box-shadow: 0 10px 20px rgba(16, 35, 68, 0.15);
    backdrop-filter: blur(2px);
    color: inherit;
    text-decoration: none;
    cursor: pointer;
    transform: translate3d(0, 0, 0);
    transition: transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
}

.case-card::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(234, 63, 48, 0.16), transparent 42%);
    opacity: 0;
    transition: opacity 0.24s ease;
}

.case-card::after {
    content: "Apri caso";
    position: absolute;
    right: 16px;
    bottom: 14px;
    z-index: 2;
    padding: 12px 18px;
    border: 1px solid var(--ax-color-accent-red-border);
    border-radius: 999px;
    background: transparent;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1;
    text-transform: uppercase;
    box-shadow: 0 10px 24px rgba(165, 27, 15, 0.22);
    opacity: 0;
    transform: translate3d(0, 8px, 0);
    transition: opacity 0.24s ease, transform 0.24s ease;
}

.case-card:hover,
.case-card:focus-visible {
    transform: translate3d(0, -8px, 0);
    border-color: rgba(255, 140, 127, 0.92);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(239, 247, 255, 0.96));
    box-shadow: 0 26px 50px rgba(3, 14, 28, 0.28), 0 0 0 1px rgba(234, 63, 48, 0.22);
}

.case-card:hover::before,
.case-card:focus-visible::before,
.case-card:hover::after,
.case-card:focus-visible::after {
    opacity: 1;
}

.case-card:hover::after,
.case-card:focus-visible::after {
    transform: translate3d(0, 0, 0);
    background: rgba(234, 63, 48, 0.12);
    border-color: var(--ax-color-accent-red-soft);
    color: #ff7366;
}

.case-card:focus-visible {
    outline: 3px solid rgba(255, 140, 127, 0.82);
    outline-offset: 4px;
}

.case-media {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #ddeeff, #b7d1f0);
}

.case-media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.32s ease, filter 0.32s ease;
}

.case-card:hover .case-media img,
.case-card:focus-visible .case-media img {
    transform: scale(1.045);
    filter: saturate(1.08) contrast(1.04);
}

.case-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #20436f;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    text-align: center;
    padding: 24px;
}

.case-body {
    position: relative;
    z-index: 2;
    padding: 16px 18px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.case-body h3 {
    margin: 0;
    color: var(--ax-color-text-dark);
    font-size: 1.08rem;
    font-weight: 700;
}

.case-body p {
    margin: 0;
    color: #315176;
    font-size: 0.9rem;
    line-height: 1.45;
    flex: 1;
}

@media (max-width: 900px) {
    .casi-overlay {
        top: 8vh;
        left: 5vw;
    }

    .case-card {
        flex-basis: 320px;
        height: 46vh;
    }

    .casi-applications {
        height: 58vh;
        margin-top: 30vh;
        padding: 8px 5vw;
    }
}

@media (max-width: 640px) {
    .casi-overlay {
        position: relative;
        inset: auto;
        margin: 0 0 14px;
    }

    .casi-applications {
        margin-top: 0;
        height: 66vh;
    }

    .case-card {
        flex-basis: 84vw;
        height: 54vh;
    }
}
</style>