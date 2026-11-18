<template>
    <!-- "Immagine interattiva": pulsing points on an image; clicking a point
         shows its text (in the side panel, or in a small card next to it). -->
    <section
        v-if="value.image?.url"
        class="cms-ii"
        :class="[
            `layout-${layout}`,
            `width-${value.width || 'wide'}`,
            `marker-${value.marker || 'ring'}`,
            `size-${value.marker_size || 'medium'}`,
            `color-${value.color || 'blue'}`,
            { 'has-motion': value.motion !== false && !pickMode, 'has-active': active, 'is-zoomed': zoomScale > 1, 'shows-detail': detailShown },
        ]"
        :style="{ '--ii-zoom': String(zoomScale) }"
        @keydown.esc="close"
    >
        <!-- Side panel (layout "panel"): intro, or the chosen point. -->
        <div v-if="layout === 'panel'" class="ii-panel" aria-live="polite">
            <Transition name="ii-fade" mode="out-in">
                <div v-if="active" :key="`p${activeIndex}`" class="ii-panel-inner">
                    <p class="ii-count">{{ (activeIndex ?? 0) + 1 }} / {{ points.length }}</p>
                    <h3>{{ active.title }}</h3>
                    <div v-if="hasText(active.text)" class="ii-text" v-html="active.text"></div>
                    <LinkOut v-if="active.href" :point="active" class="ii-more" />
                    <button type="button" class="ii-back" @click="close">← {{ labels.back }}</button>
                </div>
                <div v-else key="intro" class="ii-panel-inner">
                    <h2 v-if="hasText(value.heading)" v-html="unwrapParagraph(value.heading)"></h2>
                    <div v-if="hasText(value.intro)" class="ii-text" v-html="value.intro"></div>
                    <p class="ii-hint"><span class="ii-hint-dot" aria-hidden="true"></span>{{ value.hint || labels.hint }}</p>
                </div>
            </Transition>
        </div>

        <div class="ii-stage" @click="onStageClick">
            <!-- Zoom on click (outer) + slow drift (inner): image and points
                 move together, so the points stay on their icons. -->
            <div class="ii-zoom" :style="zoomStyle">
                <div ref="layer" class="ii-layer">
                    <ContentResponsiveImage
                        :src="value.image.url"
                        :alt="value.alt_text || value.image.alt || ''"
                        :width="value.image.width"
                        :height="value.image.height"
                        sizes="100vw lg:1200px"
                        loading="lazy"
                        decoding="async"
                    />
                    <button
                        v-for="(p, i) in points"
                        :key="i"
                        type="button"
                        class="ii-hs"
                        :class="{ 'is-active': i === activeIndex }"
                        :style="{ left: `${p.x}%`, top: `${p.y}%`, '--delay': `${(i % 5) * 0.45}s` }"
                        :aria-label="p.title"
                        :aria-pressed="i === activeIndex"
                        @click.stop="select(i)"
                    >
                        <span class="ii-pulse" aria-hidden="true"></span>
                        <span class="ii-pulse ii-p2" aria-hidden="true"></span>
                        <span class="ii-core" aria-hidden="true"></span>
                        <span class="ii-tip" aria-hidden="true">{{ p.title }}</span>
                        <span v-if="pickMode" class="ii-num">{{ i + 1 }}</span>
                    </button>
                </div>
            </div>

            <!-- Detail image of the point (e.g. a 3D render), after the zoom. -->
            <Transition name="ii-detail">
                <div v-if="detailShown && active?.detail_image?.url" class="ii-detail" @click.stop>
                    <ContentResponsiveImage
                        :src="active.detail_image.url"
                        :alt="active.title"
                        :width="active.detail_image.width"
                        :height="active.detail_image.height"
                        sizes="100vw lg:1200px"
                        loading="lazy"
                        decoding="async"
                    />
                    <button type="button" class="ii-detail-back" @click="close">← {{ labels.map }}</button>
                </div>
            </Transition>

            <!-- Card next to the point (layout "full"; below the image on phones). -->
            <Transition name="ii-pop">
                <div v-if="layout === 'full' && active" class="ii-card" :style="cardStyle" @click.stop>
                    <button type="button" class="ii-close" :aria-label="labels.close" @click="close">×</button>
                    <h3>{{ active.title }}</h3>
                    <div v-if="hasText(active.text)" class="ii-text" v-html="active.text"></div>
                    <LinkOut v-if="active.href" :point="active" class="ii-more" />
                </div>
            </Transition>

            <!-- ?posizione in the address: click to read the numbers for the CMS. -->
            <div v-if="pickMode" class="ii-pick" @click.stop>
                <template v-if="picked">Posizione orizzontale <b>{{ picked.x }}</b> · verticale <b>{{ picked.y }}</b></template>
                <template v-else>Clicca sull'immagine per leggere la posizione</template>
            </div>
            <span v-if="pickMode && picked" class="ii-pick-mark" :style="{ left: `${picked.x}%`, top: `${picked.y}%` }"></span>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onBeforeUnmount, ref, resolveComponent, watch } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

type Point = {
    x: number;
    y: number;
    title: string;
    text?: string | null;
    page?: { url?: string } | null;
    url?: string | null;
    link_label?: string | null;
    detail_image?: { url: string; width?: number; height?: number } | null;
};

const props = defineProps<{
    value: {
        heading?: string | null;
        intro?: string | null;
        hint?: string | null;
        image?: { url: string; width?: number; height?: number; alt?: string } | null;
        alt_text?: string | null;
        layout?: "panel" | "full";
        marker?: "ring" | "dot";
        marker_size?: "small" | "medium" | "large";
        color?: "blue" | "red" | "white" | "yellow";
        motion?: boolean;
        zoom?: "none" | "light" | "medium" | "strong";
        width?: "wide" | "normal";
        hotspots?: Point[];
    };
}>();

const { locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();

const TEXT: Record<string, { back: string; more: string; hint: string; close: string; map: string }> = {
    it: { back: "Panoramica", more: "Scopri di più", hint: "Clicca sui punti dell'immagine per scoprire di più", close: "Chiudi", map: "Torna all'immagine" },
    en: { back: "Overview", more: "Learn more", hint: "Click the points on the image to learn more", close: "Close", map: "Back to the image" },
    fr: { back: "Vue d'ensemble", more: "En savoir plus", hint: "Cliquez sur les points de l'image pour en savoir plus", close: "Fermer", map: "Retour à l'image" },
};
const labels = computed(() => TEXT[locale.value] ?? TEXT.it!);

const layout = computed(() => props.value.layout || "panel");
const points = computed(() =>
    (props.value.hotspots ?? [])
        .filter((p) => p && p.title && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
        .map((p) => ({
            ...p,
            x: Math.min(100, Math.max(0, Number(p.x))),
            y: Math.min(100, Math.max(0, Number(p.y))),
            href: (p.page?.url || p.url || "").trim(),
        })),
);

const activeIndex = ref<number | null>(null);
const active = computed(() => (activeIndex.value === null ? null : points.value[activeIndex.value] ?? null));

function select(i: number) {
    if (pickMode.value) return;
    activeIndex.value = activeIndex.value === i ? null : i;
}

function close() {
    activeIndex.value = null;
}

// "Zoom al clic": the picture moves so the chosen point comes to the
// centre, as close as the edges allow (no empty border ever shows).
const ZOOM: Record<string, number> = { none: 1, light: 1.6, medium: 2.1, strong: 2.8 };
const zoomScale = computed(() => (active.value && !pickMode.value ? ZOOM[props.value.zoom || "medium"] ?? 1 : 1));

function shift(pos: number, z: number): number {
    return Math.min(0, Math.max(100 - 100 * z, 50 - pos * z));
}

const zoomStyle = computed(() => {
    const p = active.value;
    const z = zoomScale.value;
    if (!p || z <= 1) return {};
    return { transform: `translate(${shift(p.x, z)}%, ${shift(p.y, z)}%) scale(${z})` };
});

// Where the point is on screen (after the zoom), in % of the image.
const shown = computed(() => {
    const p = active.value;
    const z = zoomScale.value;
    if (!p) return { x: 0, y: 0 };
    return z > 1 ? { x: shift(p.x, z) + p.x * z, y: shift(p.y, z) + p.y * z } : { x: p.x, y: p.y };
});

// The detail image fades in once the zoom has arrived.
const detailShown = ref(false);
let detailTimer: ReturnType<typeof setTimeout> | undefined;
watch(activeIndex, () => {
    detailShown.value = false;
    clearTimeout(detailTimer);
    if (active.value?.detail_image?.url) {
        detailTimer = setTimeout(() => (detailShown.value = true), zoomScale.value > 1 ? 750 : 150);
    }
});
onBeforeUnmount(() => clearTimeout(detailTimer));

// Card on the side of the point that has more room.
const cardStyle = computed(() => {
    const p = shown.value;
    if (!active.value) return {};
    const style: Record<string, string> = {};
    if (p.x > 55) style.right = `${100 - p.x + 3}%`;
    else style.left = `${p.x + 3}%`;
    if (p.y > 55) style.bottom = `${100 - p.y}%`;
    else style.top = `${p.y}%`;
    return style;
});

// Position helper: open the page with ?posizione and click the image.
const pickMode = computed(() => route.query.posizione !== undefined);
const layer = ref<HTMLElement | null>(null);
const picked = ref<{ x: string; y: string } | null>(null);

function onStageClick(event: MouseEvent) {
    if (pickMode.value && layer.value) {
        const r = layer.value.getBoundingClientRect();
        picked.value = {
            x: (((event.clientX - r.left) / r.width) * 100).toFixed(1),
            y: (((event.clientY - r.top) / r.height) * 100).toFixed(1),
        };
        return;
    }
    close();
}

function hasText(html?: string | null): boolean {
    return !!html && html.replace(/<[^>]*>/g, "").trim().length > 0;
}

// "Scopri di più": site pages open in place, other sites in a new tab.
const LinkOut = defineComponent({
    props: { point: { type: Object as () => Point & { href: string }, required: true } },
    setup(p) {
        const NuxtLink = resolveComponent("NuxtLink");
        return () => {
            const label = (p.point.link_label || labels.value.more) + " →";
            const href = p.point.href;
            if (href.startsWith("/")) return h(NuxtLink as any, { to: localePath(href) }, () => label);
            return h("a", { href, target: "_blank", rel: "noopener" }, label);
        };
    },
});
</script>

<style scoped>
.cms-ii {
    --ii-color: #4fc3ff;
    --ii-glow: rgba(79, 195, 255, 0.55);
    --ii-size: 4.8cqw;
    display: grid;
    gap: 0;
    margin: 32px 0 48px;
    overflow: hidden;
    border-radius: 18px;
    background: #0b1a2b;
    box-shadow: 0 24px 60px rgba(2, 7, 18, 0.35);
}

.color-red {
    --ii-color: #ea3f30;
    --ii-glow: rgba(234, 63, 48, 0.55);
}

.color-white {
    --ii-color: #ffffff;
    --ii-glow: rgba(255, 255, 255, 0.6);
}

.color-yellow {
    --ii-color: #ffd400;
    --ii-glow: rgba(255, 212, 0, 0.6);
}

.layout-panel {
    grid-template-columns: minmax(240px, 0.32fr) 1fr;
}

/* "Larghezza: Larga": step out of the page's text column (max 1280px). */
.cms-ii.width-wide {
    margin-inline: calc(50% - min(640px, 46vw));
}

/* ---------- Panel ---------- */
.ii-panel {
    position: relative;
    display: flex;
    align-items: center;
    padding: 40px 34px;
    background: linear-gradient(160deg, #13283f 0%, #0b1a2b 100%);
    color: #e9f2fb;
}

.ii-panel-inner {
    width: 100%;
}

.ii-panel h2 {
    margin: 0 0 16px;
    color: #ffffff;
    font-size: clamp(1.4rem, 2.2vw, 2rem);
    font-weight: 500;
    line-height: 1.2;
}

.ii-panel h3,
.ii-card h3 {
    margin: 0 0 12px;
    color: #ffffff;
    font-size: clamp(1.2rem, 1.8vw, 1.55rem);
    font-weight: 600;
    line-height: 1.25;
}

.ii-text :deep(p) {
    margin: 0 0 12px;
    color: #c9d9ea;
    font-size: 0.98rem;
    line-height: 1.65;
}

.ii-count {
    margin: 0 0 10px;
    color: var(--ii-color);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
}

.ii-hint {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 18px 0 0;
    color: #9fb6cc;
    font-size: 0.88rem;
}

.ii-hint-dot {
    position: relative;
    flex: 0 0 auto;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--ii-color);
    box-shadow: 0 0 0 0 var(--ii-glow);
    animation: ii-beat 1.8s ease-out infinite;
}

.ii-more {
    display: inline-flex;
    margin-top: 8px;
    padding: 10px 20px;
    border-radius: 999px;
    background: #c52317;
    color: #ffffff;
    font-size: 0.88rem;
    font-weight: 650;
    text-decoration: none;
    transition: filter 0.18s ease;
}

.ii-more:hover,
.ii-more:focus-visible {
    filter: brightness(1.1);
}

.ii-back {
    display: block;
    margin-top: 22px;
    padding: 0;
    border: 0;
    background: none;
    color: #9fb6cc;
    font: inherit;
    font-size: 0.88rem;
    cursor: pointer;
}

.ii-back:hover,
.ii-back:focus-visible {
    color: #ffffff;
}

/* ---------- Stage ---------- */
.ii-stage {
    position: relative;
    overflow: hidden;
    container-type: inline-size;
}

.ii-zoom {
    transform-origin: 0 0;
    transition: transform 0.9s cubic-bezier(0.22, 0.7, 0.2, 1);
}

.ii-layer {
    position: relative;
    transform-origin: 50% 50%;
}

.is-zoomed .ii-layer {
    animation-play-state: paused;
}

.ii-layer :deep(img) {
    display: block;
    width: 100%;
    height: auto;
}

.has-motion .ii-layer {
    animation: ii-drift 26s ease-in-out infinite alternate;
}

/* Slightly dim the picture while a point is open, so it stands out. */
.ii-layer::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(2, 7, 18, 0);
    transition: background 0.3s ease;
    pointer-events: none;
}

.has-active:not(.is-zoomed) .ii-layer::after {
    background: rgba(2, 7, 18, 0.18);
}

/* ---------- Points ---------- */
.ii-hs {
    position: absolute;
    z-index: 2;
    width: max(26px, var(--ii-size));
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    transform: translate(-50%, -50%);
    transition: transform 0.9s cubic-bezier(0.22, 0.7, 0.2, 1), opacity 0.3s ease;
    cursor: pointer;
}

/* Rings grow with the picture (they stay around their icon); solid dots
   keep their normal size on screen while zoomed. */
.marker-dot .ii-hs {
    transform: translate(-50%, -50%) scale(calc(1 / var(--ii-zoom, 1)));
}

.size-small {
    --ii-size: 3.6cqw;
}

.size-large {
    --ii-size: 6.2cqw;
}

.ii-hs .ii-core,
.ii-hs .ii-pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    pointer-events: none;
}

/* Ring: around an icon that is already in the picture. */
.marker-ring .ii-hs .ii-core {
    border: 2px solid var(--ii-color);
    box-shadow: 0 0 12px var(--ii-glow), inset 0 0 10px var(--ii-glow);
    transition: transform 0.2s ease, border-width 0.2s ease;
}

/* Dot: a solid point (like VEGA). */
.marker-dot .ii-hs {
    width: max(16px, calc(var(--ii-size) * 0.45));
}

.marker-dot .ii-hs .ii-core {
    background: var(--ii-color);
    box-shadow: 0 0 14px var(--ii-glow);
    transition: transform 0.2s ease;
}

.ii-hs .ii-pulse {
    border: 2px solid var(--ii-color);
    opacity: 0;
    animation: ii-pulse 2.4s ease-out infinite;
    animation-delay: var(--delay, 0s);
}

.ii-hs .ii-p2 {
    animation-delay: calc(var(--delay, 0s) + 1.2s);
}

.marker-dot .ii-hs .ii-pulse {
    border: 0;
    background: var(--ii-glow);
}

.ii-hs:hover .ii-core,
.ii-hs:focus-visible .ii-core,
.ii-hs.is-active .ii-core {
    transform: scale(1.12);
}

.marker-ring .ii-hs.is-active .ii-core {
    border-width: 3px;
}

.ii-hs:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 4px;
}

.has-active .ii-hs:not(.is-active) {
    opacity: 0.6;
}

.is-zoomed .ii-hs:not(.is-active) {
    opacity: 0.35;
}

/* ---------- Detail image (after the zoom) ---------- */
.ii-detail {
    position: absolute;
    inset: 0;
    z-index: 3;
    overflow: hidden;
    background: #0b1a2b;
}

.ii-detail :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
    animation: ii-settle 1.2s cubic-bezier(0.22, 0.7, 0.2, 1);
}

.ii-detail-back {
    position: absolute;
    left: 14px;
    bottom: 14px;
    padding: 8px 14px;
    border: 0;
    border-radius: 999px;
    background: rgba(2, 7, 18, 0.78);
    color: #ffffff;
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
}

.ii-detail-enter-active,
.ii-detail-leave-active {
    transition: opacity 0.45s ease;
}

.ii-detail-enter-from,
.ii-detail-leave-to {
    opacity: 0;
}

@keyframes ii-settle {
    0% {
        transform: scale(1.08);
    }

    100% {
        transform: scale(1);
    }
}

/* Name above the point on hover. */
.ii-tip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    padding: 5px 10px;
    border-radius: 999px;
    background: rgba(2, 7, 18, 0.85);
    color: #ffffff;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    transform: translate(-50%, 4px);
    transition: opacity 0.18s ease, transform 0.18s ease;
    pointer-events: none;
}

.ii-hs:hover .ii-tip,
.ii-hs:focus-visible .ii-tip {
    opacity: 1;
    transform: translate(-50%, 0);
}

.ii-num {
    position: absolute;
    top: -10px;
    right: -10px;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    background: #ffd400;
    color: #000000;
    font-size: 0.72rem;
    font-weight: 700;
    line-height: 20px;
}

/* ---------- Card (layout "full") ---------- */
.ii-card {
    position: absolute;
    z-index: 3;
    width: min(320px, 44%);
    padding: 22px 22px 18px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    background: rgba(11, 26, 43, 0.94);
    box-shadow: 0 18px 40px rgba(2, 7, 18, 0.45);
    backdrop-filter: blur(6px);
}

.ii-close {
    position: absolute;
    top: 8px;
    right: 10px;
    border: 0;
    background: none;
    color: #9fb6cc;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
}

/* ---------- Position helper ---------- */
.ii-pick {
    position: absolute;
    left: 12px;
    bottom: 12px;
    z-index: 4;
    padding: 8px 14px;
    border-radius: 10px;
    background: #ffd400;
    color: #000000;
    font-size: 0.9rem;
}

.ii-pick-mark {
    position: absolute;
    z-index: 4;
    width: 14px;
    height: 14px;
    border: 2px solid #ffd400;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
}

.ii-stage:has(.ii-pick) {
    cursor: crosshair;
}

/* ---------- Animations ---------- */
@keyframes ii-pulse {
    0% {
        opacity: 0.85;
        transform: scale(1);
    }

    100% {
        opacity: 0;
        transform: scale(2.1);
    }
}

@keyframes ii-beat {
    0% {
        box-shadow: 0 0 0 0 var(--ii-glow);
    }

    100% {
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }
}

@keyframes ii-drift {
    0% {
        transform: scale(1) translate(0, 0);
    }

    100% {
        transform: scale(1.05) translate(-1%, -0.6%);
    }
}

.ii-fade-enter-active,
.ii-fade-leave-active {
    transition: opacity 0.22s ease, transform 0.22s ease;
}

.ii-fade-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.ii-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.ii-pop-enter-active,
.ii-pop-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.ii-pop-enter-from,
.ii-pop-leave-to {
    opacity: 0;
    transform: scale(0.96);
}

/* Visitors who ask their device for less motion: no pulsing, no drift. */
@media (prefers-reduced-motion: reduce) {
    .has-motion .ii-layer,
    .ii-hs .ii-pulse,
    .ii-hint-dot,
    .ii-detail :deep(img) {
        animation: none;
    }

    .ii-zoom,
    .ii-hs {
        transition: none;
    }
}

/* ---------- Tablet / phone ---------- */
@media (max-width: 900px) {
    .layout-panel {
        grid-template-columns: 1fr;
    }

    .layout-panel .ii-stage {
        order: -1;
    }

    .ii-panel {
        padding: 28px 22px;
    }

    .ii-tip {
        display: none;
    }

    .ii-card {
        position: static;
        width: auto;
        margin: 0;
        border-radius: 0;
        backdrop-filter: none;
    }
}
</style>
