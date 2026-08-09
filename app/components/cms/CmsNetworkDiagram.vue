<template>
    <section class="cms-network">
        <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>

        <!-- The block is intentionally thin (heading + caption only):
             per its docstring the diagram is a fixed visual motif, not a
             per-instance configurable chart. Rendered as inline SVG so
             it inherits theme colours. -->
        <svg class="diagram" viewBox="0 0 720 160" role="img"
             :aria-label="captionText || 'Sensore, gateway, control room'">
            <defs>
                <marker id="net-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0 0 L8 4 L0 8 z" fill="currentColor" />
                </marker>
            </defs>

            <g class="flow">
                <line x1="150" y1="80" x2="290" y2="80" marker-end="url(#net-arrow)" />
                <line x1="430" y1="80" x2="570" y2="80" marker-end="url(#net-arrow)" />
            </g>

            <g class="node">
                <circle cx="90" cy="80" r="42" />
                <text x="90" y="85">Sensore</text>
            </g>
            <g class="node">
                <circle cx="360" cy="80" r="42" />
                <text x="360" y="85">Gateway</text>
            </g>
            <g class="node">
                <circle cx="630" cy="80" r="46" />
                <text x="630" y="79">Control</text>
                <text x="630" y="93">room</text>
            </g>
        </svg>

        <div v-if="value.caption" class="caption" v-html="value.caption"></div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

const props = defineProps<{ value: { heading?: string; caption?: string } }>();

// SVG aria-label needs plain text, not HTML - strip tags entirely
// rather than v-html (an <svg> attribute can't render markup anyway).
const captionText = computed(() => unwrapParagraph(props.value.caption).replace(/<[^>]+>/g, ""));
</script>

<style scoped>
.cms-network {
    padding: 64px 8vw;
    text-align: center;
}

h2 {
    margin: 0 0 30px;
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 300;
}

.diagram {
    width: 100%;
    max-width: 720px;
    height: auto;
}

.node circle {
    fill: rgba(7, 17, 29, 0.6);
    stroke: var(--ax-color-border-card);
    stroke-width: 1;
}

.node text {
    fill: var(--ax-color-text-secondary);
    font-size: 13px;
    text-anchor: middle;
}

.flow {
    color: var(--ax-color-accent-red-soft);
}

.flow line {
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-dasharray: 6 6;
    animation: net-dash 1.6s linear infinite;
}

@keyframes net-dash {
    to { stroke-dashoffset: -24; }
}

@media (prefers-reduced-motion: reduce) {
    .flow line { animation: none; }
}

.caption :deep(p) {
    margin: 22px auto 0;
    max-width: 620px;
    color: var(--ax-color-text-muted);
    font-size: 0.9rem;
    line-height: 1.55;
}
</style>
