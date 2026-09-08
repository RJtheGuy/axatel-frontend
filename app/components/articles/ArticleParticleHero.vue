<template>
    <section class="article-particle-hero" :class="{ 'is-engine-ready': engineReady }" :aria-label="title">
        <canvas ref="canvasEl" aria-hidden="true"></canvas>
        <h1 class="sr-only">{{ title }}</h1>
    </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { SequenceManager } from "@/classes/hero/SequenceManager";

type HeroEngine = import("@/classes/hero/HeroEngine").default;

const props = defineProps<{
    title: string;
    assetUrl: string;
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
const engineReady = ref(false);
let engine: HeroEngine | null = null;
let readyFrame = 0;
let mounted = false;

async function startEngine(): Promise<void> {
    if (!canvasEl.value || engine) return;

    if ("fonts" in document) {
        await document.fonts.load('350 48px "forma-djr-micro"');
    }

    const { default: HeroEngine } = await import("@/classes/hero/HeroEngine");
    if (!mounted || !canvasEl.value) return;

    engine = new HeroEngine(canvasEl.value, new SequenceManager([props.title]));
    engine.setForcedComposite(props.title, props.assetUrl);
    engine.start();
    readyFrame = requestAnimationFrame(() => {
        engineReady.value = true;
    });
}

onMounted(() => {
    mounted = true;
    void startEngine();
});

watch(
    [() => props.title, () => props.assetUrl],
    ([title, assetUrl]) => engine?.setForcedComposite(title, assetUrl)
);

onBeforeUnmount(() => {
    mounted = false;
    if (readyFrame) cancelAnimationFrame(readyFrame);
    engine?.destroy();
});
</script>

<style scoped>
.article-particle-hero {
    position: absolute;
    top: var(--ax-navbar-height, 74px);
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
}

.article-particle-hero::before {
    content: "";
    position: absolute;
    inset: -18%;
    background:
        radial-gradient(circle at 12% 18%, rgba(121, 207, 255, 0.72) 0 1px, transparent 1.8px),
        radial-gradient(circle at 28% 74%, rgba(255, 255, 255, 0.44) 0 1px, transparent 1.8px),
        radial-gradient(circle at 47% 34%, rgba(121, 207, 255, 0.58) 0 1px, transparent 1.8px),
        radial-gradient(circle at 68% 66%, rgba(255, 255, 255, 0.52) 0 1px, transparent 1.8px),
        radial-gradient(circle at 84% 22%, rgba(121, 207, 255, 0.66) 0 1px, transparent 1.8px),
        linear-gradient(135deg, rgba(8, 23, 39, 0.92), rgba(2, 7, 18, 0.98));
    background-size: 180px 180px, 240px 240px, 210px 210px, 260px 260px, 220px 220px, 100% 100%;
    opacity: 0.82;
    animation: particle-drift 18s linear infinite;
    transition: opacity 0.7s ease;
}

.article-particle-hero.is-engine-ready::before {
    opacity: 0;
}

canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
}

@keyframes particle-drift {
    from { transform: translate3d(-2%, -2%, 0); }
    to { transform: translate3d(2%, 2%, 0); }
}
</style>
