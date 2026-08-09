<template>
    <section class="cms-service-cards">
        <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>

        <div class="grid">
            <NuxtLink
                v-for="service in services"
                :key="service.id"
                :to="service.url"
                class="card"
            >
                {{ service.title }}
            </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

// As of core/api_blocks.py's PageChooserBlock, `services` is a list of
// {id, title, url} objects - not bare page IDs. If this ever renders
// empty with IDs visible in the API response instead, the backend fix
// wasn't deployed (check core/blocks.py's ServiceCardsBlock import).
type ServiceRef = { id: number; title: string; url: string };

const props = defineProps<{
    value: { heading?: string; services?: ServiceRef[] };
}>();

const services = computed<ServiceRef[]>(() => props.value.services ?? []);
</script>

<style scoped>
.cms-service-cards {
    padding: 56px 8vw;
}

h2 {
    margin: 0 0 28px;
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 300;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 18px;
}

.card {
    display: block;
    padding: 22px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: var(--ax-card-radius);
    background: rgba(7, 17, 29, 0.34);
    color: var(--ax-color-text-primary);
    text-decoration: none;
    font-weight: 600;
    transition: transform 0.22s ease, border-color 0.22s ease;
}

.card:hover {
    transform: translateY(-4px);
    border-color: var(--ax-color-accent-red-border);
}
</style>