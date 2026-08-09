<template>
    <section class="cms-solutions">
        <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>
        <div class="grid">
            <article v-for="(card, i) in cards" :key="i" class="card">
                <img v-if="card.icon?.url" class="icon" :src="card.icon.url" alt="" width="48" height="48" loading="lazy" />
                <h3 v-html="unwrapParagraph(card.title)"></h3>
                <div class="description" v-html="card.description"></div>
                <a v-if="card.link_url" class="ax-cta-outline" :href="card.link_url"
                   v-html="unwrapParagraph(card.link_label) || 'Scopri'"></a>
            </article>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

type Card = {
    icon?: { url: string };
    title: string;
    description: string;
    link_url?: string;
    link_label?: string;
};

const props = defineProps<{ value: { heading?: string; cards?: Card[] } }>();
const cards = computed<Card[]>(() => props.value.cards ?? []);
</script>

<style scoped>
.cms-solutions {
    padding: 64px 8vw;
}

h2 {
    margin: 0 0 32px;
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 300;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
}

.card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 26px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: var(--ax-card-radius);
    background: rgba(7, 17, 29, 0.34);
    transition: transform 0.22s ease, border-color 0.22s ease;
}

.card:hover {
    transform: translateY(-4px);
    border-color: var(--ax-color-accent-red-border);
}

.icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
}

h3 {
    margin: 0;
    font-size: 1.12rem;
    font-weight: 600;
}

.description :deep(p) {
    margin: 0;
    color: var(--ax-color-text-secondary);
    line-height: 1.55;
}

.card .description {
    flex: 1;
}

.ax-cta-outline {
    align-self: flex-start;
}
</style>
