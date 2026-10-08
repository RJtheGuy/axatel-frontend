<template>
    <section v-if="value.items?.length" class="cms-page-cards">
        <h2 v-if="value.heading">{{ value.heading }}</h2>

        <div class="pc-grid" :class="`pc-cols-${value.columns || 'auto'}`">
            <NuxtLink v-for="item in value.items" :key="item.url" :to="localePath(item.url)" class="pc-card">
                <span v-if="value.show_image && item.image" class="pc-media" :class="{ 'is-logo': item.kind === 'productpage' }">
                    <ContentResponsiveImage
                        :src="item.image.url"
                        :alt="item.image.alt || item.title"
                        :width="400"
                        :height="220"
                        sizes="100vw sm:50vw lg:400px"
                    />
                </span>
                <span class="pc-body">
                    <small v-if="item.category">{{ item.category }}</small>
                    <strong>{{ item.title }}</strong>
                    <span v-if="item.model_code" class="pc-meta">{{ item.model_code }}</span>
                    <span v-if="item.client" class="pc-meta">{{ item.client }}</span>
                    <span v-if="value.show_description && item.description" class="pc-desc">{{ item.description }}</span>
                    <span v-if="value.button_label" class="pc-cta">{{ value.button_label }}</span>
                </span>
            </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Card di pagine": cards for any pages of the site (products, services,
// solutions, case studies), picked in the CMS.
//
// The cards use FIXED light colours (like the cards on the Prodotti page)
// instead of the page's theme colours, so they look the same on a dark page
// and on a light one.
//
// All class names are prefixed "pc-" on purpose: the site's global
// stylesheet already defines a fixed-size ".card" (190x254 px with a glow),
// which used to leak into these cards.
type Item = {
    title: string;
    url: string;
    kind?: string;
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

/* The heading sits on the page itself, so it follows the page's colours. */
h2 {
    margin: 0 0 18px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

.pc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 18px;
}

.pc-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pc-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.pc-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.pc-card {
    display: flex;
    flex-direction: column;
    width: auto;
    height: auto;
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.1);
    text-decoration: none;
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.pc-card:hover {
    transform: translateY(-4px);
    border-color: rgba(197, 35, 23, 0.48);
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.18);
}

.pc-card:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: 3px;
}

.pc-media {
    display: block;
    height: 170px;
    overflow: hidden;
    background: linear-gradient(180deg, #eef3f9 0%, #e4ecf5 100%);
}

.pc-media img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Product pictures are logos on a transparent background: show them whole. */
.pc-media.is-logo {
    height: 200px;
}

.pc-media.is-logo img {
    padding: 16px;
    object-fit: contain;
}

.pc-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    padding: 16px 18px 18px;
}

small {
    color: #c52317;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

strong {
    color: #0b355b;
    font-size: 1.05rem;
    line-height: 1.3;
}

.pc-meta {
    color: #667f97;
    font-size: 0.84rem;
    font-weight: 600;
}

/* At most 3 lines, so a long text never cuts the card off. */
.pc-desc {
    display: -webkit-box;
    overflow: hidden;
    color: #274e72;
    font-size: 0.9rem;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
}

.pc-cta {
    margin-top: auto;
    padding-top: 6px;
    color: #c52317;
    font-size: 0.86rem;
    font-weight: 700;
}

@media (max-width: 900px) {
    .pc-cols-3,
    .pc-cols-4 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .pc-cols-2,
    .pc-cols-3,
    .pc-cols-4 {
        grid-template-columns: minmax(0, 1fr);
    }
}

@media (prefers-reduced-motion: reduce) {
    .pc-card,
    .pc-card:hover {
        transition: none;
        transform: none;
    }
}
</style>
