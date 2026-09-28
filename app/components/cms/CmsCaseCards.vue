<template>
    <section v-if="value.items?.length" class="cms-cases">
        <h2>{{ value.heading }}</h2>
        <div class="grid">
            <NuxtLink v-for="item in value.items" :key="item.url" :to="localePath(item.url)" class="card">
                <img v-if="item.image" :src="item.image.url" :alt="item.image.alt || item.title" width="400" height="220" loading="lazy" decoding="async" />
                <span class="body">
                    <small v-if="item.category">{{ item.category }}</small>
                    <strong>{{ item.title }}</strong>
                    <span v-if="item.client" class="client">{{ item.client }}</span>
                </span>
            </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Casi di successo collegati": real projects that used this solution.
defineProps<{
    value: { heading: string; items: Array<{ title: string; url: string; client?: string; category?: string; image?: { url: string; alt?: string } | null }> };
}>();
const localePath = useLocalePath();
</script>

<style scoped>
.cms-cases {
    max-width: var(--cms-wide, 1000px);
    margin: 0 auto;
    padding: 28px 0;
    border-top: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
}

h2 {
    max-width: var(--cms-measure, 760px);
    margin: 0 auto 18px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
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

.client {
    color: var(--cms-text, var(--ax-color-text-muted));
    font-size: 0.84rem;
}

@media (prefers-reduced-motion: reduce) {
    .card, .card:hover { transition: none; transform: none; }
}
</style>
