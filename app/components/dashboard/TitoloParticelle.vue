<template>
    <section class="particle-title" :aria-label="title">
        <canvas ref="canvasEl" aria-hidden="true"></canvas>
        <h1 class="sr-only">{{ title }}</h1>
    </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(
    defineProps<{
        title: string;
        align?: "left" | "center";
    }>(),
    {
        align: "left"
    }
);

type Particle = {
    x: number;
    y: number;
    tx: number;
    ty: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
};

type AmbientParticle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    size: number;
};

const canvasEl = ref<HTMLCanvasElement | null>(null);
const titleHeight = ref("clamp(132px, 18vh, 190px)");
const particles: Particle[] = [];
const ambientParticles: AmbientParticle[] = [];
let context: CanvasRenderingContext2D | null = null;
let animationFrame = 0;
let resizeObserver: ResizeObserver | null = null;
let width = 1;
let height = 1;
let pixelRatio = 1;
const titleFontFamily = "Montserrat, system-ui, sans-serif";

function splitTitle(context2d: CanvasRenderingContext2D, title: string, maxWidth: number): string[] {
    const explicitLines = title.replace(/\r\n?/g, "\n").split("\n");
    const lines: string[] = [];

    for (const explicitLine of explicitLines) {
        const words = explicitLine.trim().split(/\s+/).filter(Boolean);
        let current = "";

        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word;
            if (context2d.measureText(candidate).width <= maxWidth) {
                current = candidate;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        }

        if (current) lines.push(current);
    }

    return lines.length > 0 ? lines.slice(0, 3) : [title];
}

function buildTargets(): Array<{ x: number; y: number; alpha: number }> {
    const canvas = canvasEl.value;
    if (!canvas) return [];

    const offscreen = document.createElement("canvas");
    const sampleScale = width < 640 ? 1 : 0.72;
    offscreen.width = Math.max(1, Math.floor(width * sampleScale));
    offscreen.height = Math.max(1, Math.floor(height * sampleScale));

    const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
    if (!offscreenContext) return [];

    const fontSize = Math.max(34, Math.min(width < 640 ? 58 : 92, width * (width < 640 ? 0.14 : 0.1))) * sampleScale;
    const maxWidth = offscreen.width * 0.98;
    offscreenContext.clearRect(0, 0, offscreen.width, offscreen.height);
    offscreenContext.font = `350 ${fontSize}px ${titleFontFamily}`;
    offscreenContext.textAlign = props.align === "center" ? "center" : "left";
    offscreenContext.textBaseline = "top";
    offscreenContext.fillStyle = "#fff";

    const lines = splitTitle(offscreenContext, props.title, maxWidth);
    const lineHeight = fontSize * 1.04;
    const blockHeight = lineHeight * lines.length;
    const cssLineHeight = lineHeight / sampleScale;
    const cssBlockHeight = blockHeight / sampleScale;
    const verticalPadding = width < 640 ? 54 : 42;
    const minHeight = width < 640 ? 150 : 132;
    const maxHeight = width < 640 ? 320 : 260;
    titleHeight.value = `${Math.min(maxHeight, Math.max(minHeight, Math.ceil(cssBlockHeight + verticalPadding)))}px`;
    const startY = Math.max(4, (offscreen.height - blockHeight) * 0.5);
    const x = props.align === "center" ? offscreen.width / 2 : offscreen.width * 0.01;

    lines.forEach((line, index) => {
        offscreenContext.fillText(line, x, startY + index * lineHeight);
    });

    const imageData = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height).data;
    const targets: Array<{ x: number; y: number; alpha: number }> = [];
    const step = width < 640 ? 2 : Math.max(2, Math.round(Math.min(offscreen.width, offscreen.height) / 132));

    for (let y = 0; y < offscreen.height; y += step) {
        for (let xPos = 0; xPos < offscreen.width; xPos += step) {
            const offset = (y * offscreen.width + xPos) * 4;
            if (imageData[offset + 3]! > 24) {
                targets.push({
                    x: xPos / sampleScale,
                    y: y / sampleScale,
                    alpha: 1
                });
            }
        }
    }

    return targets;
}

function resetParticles(): void {
    const targets = buildTargets();
    particles.length = 0;
    ambientParticles.length = 0;

    const maxParticles = width < 640 ? 3400 : width > 900 ? 3200 : 2600;
    const count = Math.min(maxParticles, targets.length);

    for (let index = 0; index < count; index++) {
        const target = targets[Math.floor((index / count) * targets.length)] ?? targets[index];
        if (!target) continue;

        particles.push({
            x: target.x + (Math.random() - 0.5) * (width < 640 ? 14 : 26),
            y: target.y + (Math.random() - 0.5) * (width < 640 ? 14 : 26),
            tx: target.x,
            ty: target.y,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            alpha: target.alpha,
            size: width < 640 ? 1.65 + Math.random() * 0.55 : 1.4 + Math.random() * 0.75
        });
    }

    const ambientCount = width > 700 ? 14 : 8;
    for (let index = 0; index < ambientCount; index++) {
        ambientParticles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.16,
            vy: (Math.random() - 0.5) * 0.12,
            alpha: 0.1 + Math.random() * 0.14,
            size: 0.9 + Math.random() * 0.9
        });
    }
}

function resize(): void {
    const canvas = canvasEl.value;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    context = canvas.getContext("2d");
    context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    resetParticles();
    drawParticles();
}

function drawParticles(): void {
    if (!context) return;

    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";

    for (const particle of particles) {
        const dx = particle.tx - particle.x;
        const dy = particle.ty - particle.y;
        particle.vx = (particle.vx + dx * 0.018) * 0.86;
        particle.vy = (particle.vy + dy * 0.018) * 0.86;
        particle.x += particle.vx;
        particle.y += particle.vy;

        context.globalAlpha = particle.alpha;
        context.fillStyle = "#dff8ff";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
    }

    for (const particle of ambientParticles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -12) particle.x = width + 12;
        if (particle.x > width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = height + 12;
        if (particle.y > height + 12) particle.y = -12;

        context.globalAlpha = particle.alpha;
        context.fillStyle = "#d9f4ff";
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
    }

    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
}

function render(): void {
    drawParticles();
    animationFrame = requestAnimationFrame(render);
}

onMounted(() => {
    resize();
    resizeObserver = new ResizeObserver(resize);
    if (canvasEl.value) {
        resizeObserver.observe(canvasEl.value);
    }
    animationFrame = requestAnimationFrame(render);

    if ("fonts" in document) {
        void Promise.all([
            document.fonts.load(`350 48px ${titleFontFamily}`),
            document.fonts.ready
        ]).then(() => resize());
    }
});

watch(() => props.title, resetParticles);

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
});
</script>

<style scoped>
.particle-title {
    position: relative;
    width: 100%;
    height: v-bind(titleHeight);
    overflow: hidden;
}

canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
}
</style>