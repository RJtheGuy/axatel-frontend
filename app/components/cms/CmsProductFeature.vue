<template>
    <aside class="cms-product-feature">
        <p v-if="value.label" class="label">{{ value.label }}</p>
        <h2>{{ value.name }}</h2>
        <p class="description">{{ value.description }}</p>
        <div v-if="value.product_url || value.link_url" class="actions">
            <NuxtLink v-if="value.product_url" :to="localePath(value.product_url)" class="primary">
                {{ t("products.viewProduct") }} <span aria-hidden="true">→</span>
            </NuxtLink>
            <a v-if="value.link_url" :href="value.link_url" target="_blank" rel="noopener noreferrer" class="secondary">
                {{ value.link_label || t("products.datasheet") }}
            </a>
        </div>
    </aside>
</template>

<script setup lang="ts">
// "Prodotto in evidenza": the Axatel product or service behind a solution.
defineProps<{
    value: { label?: string; name: string; description: string; product_url?: string | null; link_url?: string; link_label?: string };
}>();
const { t } = useI18n();
const localePath = useLocalePath();
</script>

<style scoped>
.cms-product-feature {
    max-width: var(--cms-measure, 760px);
    margin: 12px auto 28px;
    padding: 26px 28px;
    border-radius: 16px;
    color: #f2f8ff;
    background:
        radial-gradient(circle at 90% 0%, rgba(234, 63, 48, 0.22), transparent 55%),
        linear-gradient(160deg, #0b1a2b 0%, #050d18 100%);
}

.label {
    margin: 0 0 8px;
    color: #ff8a7d;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.cms-product-feature h2 {
    margin: 0 0 10px;
    color: #fff;
    font-size: clamp(1.4rem, 2.6vw, 1.9rem);
    font-weight: 500;
}

.description {
    margin: 0;
    max-width: 60ch;
    color: #c6dcef;
    line-height: 1.6;
}

.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
}

.actions a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 42px;
    padding: 0 18px;
    border-radius: 999px;
    font-size: 0.84rem;
    font-weight: 650;
    text-decoration: none;
}

.primary {
    color: #fff;
    background: var(--ax-color-accent-red, #c52317);
}

.primary:hover {
    background: var(--ax-color-accent-red-soft, #ea3f30);
}

.secondary {
    color: #fff;
    border: 1px solid rgba(198, 220, 239, 0.35);
}

.secondary:hover {
    border-color: rgba(198, 220, 239, 0.75);
}

.actions a:focus-visible {
    outline: 2px solid #8bd9ff;
    outline-offset: 3px;
}
</style>
