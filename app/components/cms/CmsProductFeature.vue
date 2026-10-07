<template>
    <aside class="cms-product-feature">
        <p v-if="value.label" class="label">{{ value.label }}</p>
        <h2>{{ value.name }}</h2>
        <p class="description">{{ value.description }}</p>
        <div v-if="actions.length" class="actions">
            <template v-for="(action, index) in actions" :key="index">
                <NuxtLink v-if="action.internal" :to="localePath(action.href)" :class="action.style">
                    {{ action.label }} <span v-if="action.arrow" aria-hidden="true">→</span>
                </NuxtLink>
                <a v-else :href="action.href" target="_blank" rel="noopener noreferrer" :class="action.style">
                    {{ action.label }}
                </a>
            </template>
        </div>
    </aside>
</template>

<script setup lang="ts">
// "Prodotto in evidenza": the Axatel product or service behind a solution.
// Buttons, in order: the product page (if chosen), the old single "Link
// alternativo" (if still filled in), then every entry of "Pulsanti".
type Button = { label: string; href: string; kind: "page" | "document" | "url"; style?: string };
const props = defineProps<{
    value: {
        label?: string;
        name: string;
        description: string;
        product_url?: string | null;
        link_url?: string;
        link_label?: string;
        buttons?: Button[];
    };
}>();
const { t } = useI18n();
const localePath = useLocalePath();

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/media/");
const actions = computed(() => {
    const list: Array<{ label: string; href: string; internal: boolean; style: string; arrow: boolean }> = [];
    if (props.value.product_url) {
        list.push({ label: t("products.viewProduct"), href: props.value.product_url, internal: true, style: "primary", arrow: true });
    }
    if (props.value.link_url) {
        list.push({
            label: props.value.link_label || t("products.datasheet"),
            href: props.value.link_url,
            internal: isInternal(props.value.link_url),
            style: "secondary",
            arrow: false,
        });
    }
    for (const button of props.value.buttons ?? []) {
        if (!button?.label || !button?.href) continue;
        const internal = button.kind === "page" && isInternal(button.href);
        list.push({ label: button.label, href: button.href, internal, style: button.style === "primary" ? "primary" : "secondary", arrow: internal });
    }
    return list;
});
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
