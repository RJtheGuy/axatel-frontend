<template>
    <section class="cms-portfolio">
        <header class="head">
            <h2 v-if="value.heading" v-html="unwrapParagraph(value.heading)"></h2>
            <a v-if="value.view_all_url" class="ax-cta-outline" :href="value.view_all_url"
               v-html="unwrapParagraph(value.view_all_label) || 'Vedi tutto'"></a>
        </header>

        <div class="grid">
            <component
                :is="item.url ? 'a' : 'div'"
                v-for="(item, i) in items"
                :key="i"
                class="item"
                :href="item.url || undefined"
            >
                <div class="media">
                    <img
                        v-if="item.image?.url"
                        :src="item.image.url"
                        :alt="unwrapParagraph(item.title).replace(/<[^>]+>/g, '') || item.image.alt"
                        width="360"
                        height="220"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
                <div class="body">
                    <h3 v-html="unwrapParagraph(item.title)"></h3>
                    <div v-if="item.client" class="client" v-html="item.client"></div>
                    <div v-if="item.excerpt" class="excerpt" v-html="item.excerpt"></div>
                </div>
            </component>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { unwrapParagraph } from "~/composables/richtext";

type Item = {
    image?: { url: string; alt?: string };
    title: string;
    client?: string;
    excerpt?: string;
    url?: string;
};

const props = defineProps<{
    value: {
        heading?: string;
        view_all_url?: string;
        view_all_label?: string;
        items?: Item[];
    };
}>();

const items = computed<Item[]>(() => props.value.items ?? []);
</script>

<style scoped>
.cms-portfolio {
    padding: 64px 8vw;
}

.head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 30px;
}

h2 {
    margin: 0;
    font-size: clamp(1.4rem, 2.8vw, 2rem);
    font-weight: 300;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
}

.item {
    display: grid;
    grid-template-rows: 190px 1fr;
    overflow: hidden;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 14px;
    background: rgba(7, 17, 29, 0.34);
    color: inherit;
    text-decoration: none;
    transition: transform 0.22s ease, border-color 0.22s ease;
}

a.item:hover {
    transform: translateY(-5px);
    border-color: var(--ax-color-accent-red-border);
}

.media {
    overflow: hidden;
    background: linear-gradient(135deg, rgba(234, 63, 48, 0.16), rgba(121, 207, 255, 0.12));
}

.media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.body {
    padding: 18px;
}

h3 {
    margin: 0 0 6px;
    font-size: 1.1rem;
    font-weight: 600;
}

.client :deep(p) {
    margin: 0;
    color: var(--ax-color-text-muted);
    font-size: 0.82rem;
    font-weight: 700;
}

.excerpt :deep(p) {
    margin: 8px 0 0;
    color: var(--ax-color-text-secondary);
    font-size: 0.92rem;
    line-height: 1.5;
}
</style>
