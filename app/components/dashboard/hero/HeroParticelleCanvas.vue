<template>
    <section ref="heroEl" class="hero" :class="{ 'is-engine-ready': engineReady }">
        <canvas ref="canvas"></canvas>

        <div class="overlay">
            <button
                class="scroll-invite"
                type="button"
                aria-label="Vai alle demo interattive"
                @click="requestDemoScroll"
            >
                <span>Scopri come funziona</span>
                <svg class="arrow-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { SequenceManager } from "@/classes/hero/SequenceManager";
type HeroEngine = import("@/classes/hero/HeroEngine").default;

const props = defineProps<{
    frasi?: string[];
    quoteText?: string;
    casesLogoAsset?: string;
}>();

const defaultFrasi = [
    "Ogni sensore comunica",
    "Ogni dato conta",
    "Ogni evento viene monitorato",
    "Ogni decisione ha valore"
];

const DEFAULT_QUOTE_TEXT = "Tutti noi di Axatel abbiamo un obiettivo in comune:\nabbiamo a cuore ciò che facciamo e l'impatto positivo che generiamo per i nostri partner e per le comunità in cui viviamo e operiamo.\nPer noi e sempre una questione personale";
const DEFAULT_CASES_LOGO_ASSET = "/immagini/Angel.png";

const resolveFrasi = (frasi?: string[]): string[] => {
    return frasi && frasi.length > 0 ? frasi : defaultFrasi;
};

const resolveQuoteText = (quoteText?: string): string => {
    if (!quoteText) return DEFAULT_QUOTE_TEXT;
    const normalized = quoteText.trim();
    return normalized.length > 0 ? normalized : DEFAULT_QUOTE_TEXT;
};

const resolveCasesLogoAsset = (asset?: string): string => {
    if (!asset) return DEFAULT_CASES_LOGO_ASSET;
    const normalized = asset.trim();
    return normalized.length > 0 ? normalized : DEFAULT_CASES_LOGO_ASSET;
};

function requestDemoScroll(): void {
    window.dispatchEvent(new CustomEvent("axatel-demo-jump"));
}

const canvas = ref<HTMLCanvasElement | null>(null);
const heroEl = ref<HTMLElement | null>(null);
const engineReady = ref(false);
const sequence = new SequenceManager(resolveFrasi(props.frasi));

let engine: HeroEngine | null = null;
type SectionKey = "hero" | "demo" | "quote" | "cases";

type SectionElements = Record<SectionKey, Element | null>;
type SectionRatios = Record<SectionKey, number>;

// Hysteresis thresholds prevent rapid toggling near section boundaries.
const SWITCH_DELTA = 0.12;
const CURRENT_HOLD_RATIO = 0.35;
const CANDIDATE_MIN_RATIO = 0.45;

let activeSection: SectionKey | null = null;
let isMounted = false;
let sectionEls: SectionElements = {
    hero: null,
    demo: null,
    quote: null,
    cases: null
};
let domObserver: MutationObserver | null = null;
const visibleRaf = ref(0);
let engineStartTimeout: ReturnType<typeof setTimeout> | null = null;
let engineStartRaf = 0;
let engineReadyRaf = 0;
let engineStartQueued = false;

function visibleRatio(el: Element | null): number {
    if (!el) return 0;
    const rect = (el as HTMLElement).getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const base = Math.max(1, Math.min(vh, rect.height || vh));
    return visible / base;
}

function applySectionState(next: SectionKey): void {
    if (!engine || next === activeSection) return;

    activeSection = next;

    if (next === "hero") {
        engine.setFormationSuppressed(false);
        engine.clearForcedStage();
        return;
    }

    if (next === "demo") {
        engine.setAmbientFlow();
        return;
    }

    if (next === "quote") {
        engine.setFormationSuppressed(false);
        engine.setForcedText(resolveQuoteText(props.quoteText));
        return;
    }

    engine.setFormationSuppressed(false);
    engine.setForcedLogoAsset(resolveCasesLogoAsset(props.casesLogoAsset));
}

function updateSectionRefs(): void {
    sectionEls = {
        hero: document.querySelector("section.hero"),
        demo: document.querySelector("section.demo-section"),
        quote: document.querySelector("section.citazione-section"),
        cases: document.querySelector("section.casi-section")
    };
}

function getBestSection(ratios: SectionRatios): { key: SectionKey; ratio: number } {
    let best: SectionKey = "hero";
    let bestRatio = ratios.hero;

    for (const key of ["demo", "quote", "cases"] as const) {
        if (ratios[key] > bestRatio) {
            best = key;
            bestRatio = ratios[key];
        }
    }

    return { key: best, ratio: bestRatio };
}

function pickNextSection(ratios: SectionRatios): SectionKey {
    const best = getBestSection(ratios);

    if (!activeSection) return best.key;

    const currentRatio = ratios[activeSection];
    if (best.key === activeSection) return activeSection;

    const enoughLead = best.ratio >= currentRatio + SWITCH_DELTA;
    const currentStillDominant = currentRatio >= CURRENT_HOLD_RATIO;
    const challengerStrong = best.ratio >= CANDIDATE_MIN_RATIO;

    if (enoughLead && (!currentStillDominant || challengerStrong)) {
        return best.key;
    }

    return activeSection;
}

function syncActiveSectionFromViewport(): void {
    if (!engine) return;

    const ratios: SectionRatios = {
        hero: visibleRatio(sectionEls.hero),
        demo: visibleRatio(sectionEls.demo),
        quote: visibleRatio(sectionEls.quote),
        cases: visibleRatio(sectionEls.cases)
    };

    // If refs are stale (all zero), refresh once and recompute.
    if (ratios.hero === 0 && ratios.demo === 0 && ratios.quote === 0 && ratios.cases === 0) {
        updateSectionRefs();
        ratios.hero = visibleRatio(sectionEls.hero);
        ratios.demo = visibleRatio(sectionEls.demo);
        ratios.quote = visibleRatio(sectionEls.quote);
        ratios.cases = visibleRatio(sectionEls.cases);
    }

    const next = pickNextSection(ratios);
    applySectionState(next);
}

function requestSectionSync(): void {
    if (visibleRaf.value) return;
    visibleRaf.value = requestAnimationFrame(() => {
        visibleRaf.value = 0;
        syncActiveSectionFromViewport();
    });
}

async function startEngine(): Promise<void> {
    if (!canvas.value || engine) return;

    removeEngineStartIntentListeners();

    const { default: HeroEngine } = await import("@/classes/hero/HeroEngine");

    if (!isMounted || !canvas.value) return;

    updateSectionRefs();
    const initialSection = getBestSection({
        hero: visibleRatio(sectionEls.hero),
        demo: visibleRatio(sectionEls.demo),
        quote: visibleRatio(sectionEls.quote),
        cases: visibleRatio(sectionEls.cases)
    }).key;
    const initialStage = initialSection === "demo"
        ? { id: "initial-demo-flow", type: "flow" as const, duration: 9999 }
        : undefined;

    engine = new HeroEngine(canvas.value, sequence, initialStage);
    engine.setFormationSuppressed(false);
    engine.start();
    engineReadyRaf = requestAnimationFrame(() => {
        engineReady.value = true;
    });

    requestSectionSync();

    domObserver = new MutationObserver(() => {
        updateSectionRefs();
        requestSectionSync();
    });
    domObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener("scroll", requestSectionSync, { passive: true });
    window.addEventListener("resize", requestSectionSync);
}

function clearDeferredEngineStart(): void {
    if (engineStartRaf) {
        cancelAnimationFrame(engineStartRaf);
        engineStartRaf = 0;
    }
    if (engineStartTimeout) {
        clearTimeout(engineStartTimeout);
        engineStartTimeout = null;
    }
}

function queueEngineStart(delay = 0): void {
    if (engine) return;
    if (delay > 0 && engineStartQueued) return;

    engineStartQueued = true;
    clearDeferredEngineStart();

    const run = () => {
        engineStartTimeout = null;
        void startEngine();
    };

    if (delay > 0) {
        engineStartTimeout = setTimeout(run, delay);
        return;
    }

    engineStartTimeout = setTimeout(run, 120);
    engineStartRaf = requestAnimationFrame(() => {
        engineStartRaf = 0;
        if (engineStartTimeout) {
            clearTimeout(engineStartTimeout);
            engineStartTimeout = null;
        }
        run();
    });
}

function queueEngineStartFromIntent(): void {
    queueEngineStart();
}

function addEngineStartIntentListeners(): void {
    window.addEventListener("pointermove", queueEngineStartFromIntent, { passive: true, once: true });
    window.addEventListener("touchstart", queueEngineStartFromIntent, { passive: true, once: true });
    window.addEventListener("keydown", queueEngineStartFromIntent, { once: true });
}

function removeEngineStartIntentListeners(): void {
    window.removeEventListener("pointermove", queueEngineStartFromIntent);
    window.removeEventListener("touchstart", queueEngineStartFromIntent);
    window.removeEventListener("keydown", queueEngineStartFromIntent);
}

onMounted(() => {
    isMounted = true;
    addEngineStartIntentListeners();
    queueEngineStart();
});

watch(
    () => props.frasi,
    (newFrasi) => {
        const frasi = resolveFrasi(newFrasi);

        if (engine) {
            engine.applyPhrases(frasi);
            return;
        }

        sequence.setPhrases(frasi);
    },
    { deep: false }
);

watch(
    () => [props.quoteText, props.casesLogoAsset],
    () => {
        if (!engine || !activeSection) return;
        applySectionState(activeSection);
    },
    { deep: false }
);

onBeforeUnmount(() => {
    isMounted = false;
    removeEngineStartIntentListeners();
    window.removeEventListener("scroll", requestSectionSync);
    window.removeEventListener("resize", requestSectionSync);
    domObserver?.disconnect();
    domObserver = null;
    if (visibleRaf.value) {
        cancelAnimationFrame(visibleRaf.value);
        visibleRaf.value = 0;
    }
    clearDeferredEngineStart();
    if (engineReadyRaf) {
        cancelAnimationFrame(engineReadyRaf);
        engineReadyRaf = 0;
    }
    if (engineStartTimeout) {
        clearTimeout(engineStartTimeout);
        engineStartTimeout = null;
    }
    engine?.destroy();
});
</script>

<style scoped>
.hero{
    position: relative;
    width: 100vw;
    max-width: 100vw;
    min-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    min-height: 100vh;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    outline: none;
    box-shadow: none;
    overflow:hidden;
    background:transparent;
}

.hero::before{
    content:"";
    position:absolute;
    inset:-18%;
    z-index:0;
    pointer-events:none;
    background:
        radial-gradient(circle at 12% 18%, rgba(121,207,255,.72) 0 1px, transparent 1.8px),
        radial-gradient(circle at 28% 74%, rgba(255,255,255,.44) 0 1px, transparent 1.8px),
        radial-gradient(circle at 47% 34%, rgba(121,207,255,.58) 0 1px, transparent 1.8px),
        radial-gradient(circle at 68% 66%, rgba(255,255,255,.52) 0 1px, transparent 1.8px),
        radial-gradient(circle at 84% 22%, rgba(121,207,255,.66) 0 1px, transparent 1.8px),
        linear-gradient(135deg, rgba(8,23,39,.92), rgba(2,7,18,.98));
    background-size: 180px 180px, 240px 240px, 210px 210px, 260px 260px, 220px 220px, 100% 100%;
    opacity:.82;
    transform:translateZ(0);
    will-change:transform, opacity;
    animation:particleDrift 18s linear infinite;
    transition:opacity .7s ease;
}

.hero.is-engine-ready::before{
    opacity:0;
}

canvas{
    position:fixed;
    top:0;
    left:0;
    width:100vw;
    height:100vh;
    margin:0;
    padding:0;
    border:0;
    outline:none;
    box-shadow:none;
    display:block;
    pointer-events:none;
    z-index:0;
}

.overlay{
    position:absolute;
    inset:0;
    pointer-events:none;
    z-index:2;
}

.hero-cta {
    position: absolute;
    left: 8vw;
    bottom: 12vh;
    pointer-events: auto;
    box-shadow: 0 10px 24px rgba(165, 27, 15, 0.22);
}

.scroll-invite {
    position: absolute;
    bottom: 40px;
    left: 50%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: rgba(255, 255, 255, 0.4);
    font: inherit;
    transform: translateX(-50%);
    cursor: pointer;
    pointer-events: auto;
    padding: 0;
    transition: color 0.2s ease;
}

.scroll-invite:hover,
.scroll-invite:focus-visible {
    color: rgba(255, 255, 255, 0.82);
}

.scroll-invite:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.36);
    outline-offset: 6px;
    border-radius: 999px;
}

.scroll-invite span {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.4rem;
    font-weight: 400;
}

.arrow-down {
    width: 40px;
    height: 40px;
    animation: float 2s infinite ease-in-out;
}

@keyframes particleDrift{
    0%{
        transform:translate3d(-2%, -2%, 0);
    }
    100%{
        transform:translate3d(2%, 2%, 0);
    }
}

@keyframes float{
    0%, 100%{
        transform:translateY(0);
        opacity:0.4;
    }
    50%{
        transform:translateY(6px);
        opacity:1;
    }
}

@media (max-width: 1024px) {
    .hero-cta {
        left: 6vw;
        bottom: 10vh;
    }
}

@media (max-width: 768px) {
    .scroll-invite {
        bottom: 30px;
    }

    .scroll-invite span {
        font-size: 0.72rem;
        letter-spacing: 0.24rem;
    }

    .arrow-down {
        width: 34px;
        height: 34px;
    }

    .hero-cta {
        left: 5vw;
        transform: none;
        bottom: 8vh;
        font-size: 0.74rem;
        padding: 10px 14px;
        width: max-content;
        max-width: calc(100vw - 36px);
        text-align: left;
    }
}
</style>