<template>
    <section ref="root" class="cms-stats" :data-variant="value.variant || 'default'">
        <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>
        <div class="stats-grid">
            <div v-for="(stat, i) in items" :key="i" class="stat">
                <div class="stat-value">
                    {{ displayed[i] }}<span class="suffix">{{ stat.suffix }}</span>
                </div>
                <div class="stat-label" v-html="stat.label"></div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

// NOTE: `value` and `suffix` below are deliberately NOT run through
// v-html or any rich-text handling - they stayed plain fields on the
// Django side (core/blocks_additions.py) precisely because they feed
// the countUp() animation and get concatenated directly into
// displayed[i] + stat.suffix. HTML markup in either would break the
// counter, not just look odd. Only `label` (a pure caption under the
// number) was converted to rich text.
type Stat = { value: number; suffix?: string; label: string };

const props = defineProps<{ value: { heading?: string; stats?: Stat[]; variant?: "default" | "accent" | "muted" } }>();

const items = computed<Stat[]>(() => props.value.stats ?? []);
const root = ref<HTMLElement | null>(null);
const displayed = ref<number[]>([]);

let observer: IntersectionObserver | null = null;
let raf = 0;

/* The StatItemBlock docstring says numbers count up from zero when
   scrolled into view (the old app.js initStatCounters). Reimplemented
   here with rAF rather than a global init pass, so the animation is
   owned by the component that renders it. */
function countUp() {
    const targets = items.value.map((s) => Number(s.value) || 0);
    const duration = 1400;
    const start = performance.now();

    const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        displayed.value = targets.map((v) => Math.round(v * eased));
        if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
}

onMounted(() => {
    displayed.value = items.value.map(() => 0);

    // Respect the user's motion preference — jump straight to the final
    // numbers rather than animating.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
        displayed.value = items.value.map((s) => Number(s.value) || 0);
        return;
    }

    if (!root.value || !("IntersectionObserver" in window)) {
        countUp();
        return;
    }

    observer = new IntersectionObserver(
        (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                countUp();
                observer?.disconnect();
                observer = null;
            }
        },
        { threshold: 0.3 }
    );
    observer.observe(root.value);
});

onUnmounted(() => {
    observer?.disconnect();
    if (raf) cancelAnimationFrame(raf);
});
</script>

<style scoped>
.cms-stats {
    padding: 64px 8vw;
}

h2 {
    margin: 0 0 34px;
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 300;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 26px;
}

.stat-value {
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    font-weight: 200;
    line-height: 1;
    color: var(--ax-color-text-primary);
}

.suffix {
    color: var(--ax-color-accent-red-soft);
}

.stat-label :deep(p) {
    margin-top: 10px;
    color: var(--ax-color-text-muted);
    font-size: 0.88rem;
    line-height: 1.4;
}

/* Section variant - see "Stile della sezione" in the Wagtail admin. */
.cms-stats[data-variant="accent"] .stat-value {
    color: var(--ax-color-accent-red-soft);
}

.cms-stats[data-variant="muted"] .stat-value {
    color: var(--ax-color-text-secondary);
    font-weight: 300;
}
</style>
