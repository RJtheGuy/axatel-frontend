<template>
    <section v-if="value.items?.length" class="cms-page-cards">
        <h2 v-if="value.heading">{{ value.heading }}</h2>

        <div class="grid" :class="`cols-${value.columns || 'auto'}`">
            <NuxtLink v-for="item in value.items" :key="item.url" :to="localePath(item.url)" class="card">
                <img
                    v-if="value.show_image && item.image"
                    :src="item.image.url"
                    :alt="item.image.alt || item.title"
                    width="400"
                    height="220"
                    loading="lazy"
                    decoding="async"
                />
                <span class="body">
                    <small v-if="item.category">{{ item.category }}</small>
                    <strong>{{ item.title }}</strong>
                    <span v-if="item.model_code" class="meta">{{ item.model_code }}</span>
                    <span v-if="item.client" class="meta">{{ item.client }}</span>
                    <span v-if="value.show_description && item.description" class="desc">{{ item.description }}</span>
                    <span v-if="value.button_label" class="cta">{{ value.button_label }}</span>
                </span>
            </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Card di pagine": cards for any pages of the site (products, services,
// solutions, case studies), picked in the CMS.
type Item = {
    title: string;
    url: string;
    category?: string;
    client?: string;
    model_code?: string;
    description?: string;
    image?: { url: string; alt?: string } | null;
};

defineProps<{
    value: {
        heading?: string;
        columns?: "auto" | "2" | "3" | "4";
        show_image?: boolean;
        show_description?: boolean;
        button_label?: string;
        items: Item[];
    };
}>();

const localePath = useLocalePath();
</script>

<style scoped>
.cms-page-cards {
    max-width: var(--cms-wide, 1000px);
    margin: 0 auto;
    padding: 28px 0;
}

h2 {
    margin: 0 0 18px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
}

.cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--cms-border, rgba(147, 183, 218, 0.22));
    border-radius: 14px;
    background: var(--cms-surface, rgba(12, 29, 45, 0.5));
    text-decoration: none;
    transition: border-color 0.2s ease, transform 0.2s ease;
}

.card:hover {
    border-color: rgba(197, 35, 23, 0.45);
    transform: translateY(-2px);
}

.card:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft, #ea3f30);
    outline-offset: 3px;
}

img {
    display: block;
    width: 100%;
    height: 160px;
    object-fit: cover;
}

.body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    padding: 16px 18px 18px;
}

small {
    color: var(--ax-color-accent-red-soft, #c52317);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

strong {
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: 1rem;
    line-height: 1.35;
}

.meta {
    color: var(--cms-text, var(--ax-color-text-primary));
    font-size: 0.84rem;
}

.desc {
    color: var(--cms-text, var(--ax-color-text-primary));
    font-size: 0.92rem;
    line-height: 1.5;
}

.cta {
    margin-top: auto;
    padding-top: 6px;
    color: var(--ax-color-accent-red-soft, #c52317);
    font-size: 0.86rem;
    font-weight: 700;
}

@media (max-width: 900px) {
    .cols-3,
    .cols-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .cols-2,
    .cols-3,
    .cols-4 {
        grid-template-columns: minmax(0, 1fr);
    }
}

@media (prefers-reduced-motion: reduce) {
    .card,
    .card:hover {
        transition: none;
        transform: none;
    }
}
</style>
