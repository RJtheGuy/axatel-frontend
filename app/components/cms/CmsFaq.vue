<template>
    <section class="cms-faq">
        <h2 v-if="value.heading">{{ value.heading }}</h2>
        <details v-for="(item, index) in value.items" :key="index" class="faq-item">
            <summary>
                <span>{{ item.question }}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
            </summary>
            <div class="answer" v-html="item.answer"></div>
        </details>
    </section>
</template>

<script setup lang="ts">
/**
 * "Domande frequenti": questions that open one at a time. Also tells
 * search engines the questions and answers (schema.org FAQPage), which
 * Google can show directly in its results.
 */
import { computed } from "vue";

const props = defineProps<{ value: { heading?: string; items: Array<{ question: string; answer: string }> } }>();

const plain = (htmlText: string) => htmlText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

useHead({
    script: [
        {
            type: "application/ld+json",
            innerHTML: computed(() =>
                JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: (props.value.items ?? []).map((item) => ({
                        "@type": "Question",
                        name: item.question,
                        acceptedAnswer: { "@type": "Answer", text: plain(item.answer) },
                    })),
                })
            ),
        },
    ],
});
</script>

<style scoped>
.cms-faq {
    max-width: var(--cms-measure, 760px);
    margin: 0 auto;
    padding: 28px 0;
    border-top: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
}

h2 {
    margin: 0 0 14px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

.faq-item {
    border-bottom: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
}

summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 0;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-weight: 600;
    line-height: 1.4;
    list-style: none;
    cursor: pointer;
}

summary::-webkit-details-marker {
    display: none;
}

summary svg {
    flex: 0 0 18px;
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    transition: transform 0.2s ease;
}

details[open] summary svg {
    transform: rotate(180deg);
}

summary:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft);
    outline-offset: 2px;
}

.answer {
    padding: 0 0 18px;
}

.answer :deep(p) {
    margin: 0 0 0.8em;
    color: var(--cms-text, var(--ax-color-text-secondary));
    line-height: 1.7;
}

.answer :deep(a) {
    color: var(--ax-color-accent-red-soft);
}
</style>
