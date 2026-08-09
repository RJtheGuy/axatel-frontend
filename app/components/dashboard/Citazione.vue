<template>
    <section ref="sectionEl" class="citazione-section">
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const sectionEl = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

function emitQuoteVisibility(active: boolean): void {
    window.dispatchEvent(
        new CustomEvent("axatel-quote-visibility", {
            detail: { active }
        })
    );
}

onMounted(() => {
    if (!sectionEl.value) return;

    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            if (!entry) return;

            const active = entry.isIntersecting && entry.intersectionRatio > 0.55;
            emitQuoteVisibility(active);
        },
        {
            threshold: [0, 0.25, 0.55, 0.8, 1]
        }
    );

    observer.observe(sectionEl.value);
});

onBeforeUnmount(() => {
    observer?.disconnect();
    emitQuoteVisibility(false);
});
</script>

<style scoped>
.citazione-section {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    background: transparent;
    overflow: hidden;
}

.citazione-overlay {
    position: absolute;
    right: 7vw;
    bottom: 8vh;
    text-align: right;
    pointer-events: none;
    z-index: 1;
}

.firma {
    margin: 0;
    color: rgba(233, 245, 255, 0.98);
    font-size: clamp(1rem, 1.3vw, 1.35rem);
    font-weight: 700;
    letter-spacing: 0.03em;
    text-shadow: 0 8px 24px rgba(4, 14, 26, 0.65);
}

</style>
