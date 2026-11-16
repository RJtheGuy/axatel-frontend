<template>
    <!-- "Pulsanti sotto l'immagine" of a product (Prodotto → CMS). -->
    <div v-if="links.length" class="pml" :class="`align-${align || 'center'}`">
        <a
            v-for="(link, i) in links"
            :key="i"
            :href="link.href"
            class="pml-btn"
            :class="[
                `bg-${link.background || 'red'}`,
                `tx-${textColor(link)}`,
                `font-${link.font || 'normal'}`,
                `size-${link.size || 'normal'}`,
            ]"
            :target="link.open_in_new_tab ? '_blank' : undefined"
            :rel="link.open_in_new_tab ? 'noopener' : undefined"
        >
            <span>{{ link.label }}</span>
            <span class="icon" aria-hidden="true">{{ link.isFile ? "↓" : link.open_in_new_tab ? "↗" : "→" }}</span>
        </a>
    </div>
</template>

<script setup lang="ts">
// Each button is a file (document) or a link, with its own background,
// text colour, font and size chosen in the CMS. "Automatico" picks a text
// colour that is readable on the chosen background.
import { computed } from "vue";

export type ProductLink = {
    type?: string;
    value: {
        label: string;
        document?: { url: string; title?: string } | null;
        url?: string | null;
        open_in_new_tab?: boolean;
        background?: "red" | "navy" | "ivory" | "white" | "none";
        text_color?: "auto" | "white" | "ivory" | "navy" | "red";
        font?: "normal" | "heading" | "mono";
        size?: "small" | "normal" | "large";
    };
};

const props = defineProps<{
    items?: ProductLink[] | null;
    align?: "left" | "center" | "right" | "full" | null;
}>();

const AUTO_TEXT: Record<string, string> = { red: "white", navy: "white", ivory: "navy", white: "navy", none: "red" };

const links = computed(() =>
    (props.items ?? [])
        .map((item) => item?.value)
        .filter((v): v is ProductLink["value"] => !!v && !!v.label && !!(v.document?.url || v.url))
        .map((v) => ({ ...v, href: (v.document?.url || v.url || "").trim(), isFile: !!v.document?.url })),
);

function textColor(link: ProductLink["value"]): string {
    const chosen = link.text_color || "auto";
    return chosen === "auto" ? AUTO_TEXT[link.background || "red"] || "white" : chosen;
}
</script>

<style scoped>
.pml {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
}

.align-left {
    justify-content: flex-start;
}

.align-center {
    justify-content: center;
}

.align-right {
    justify-content: flex-end;
}

.align-full {
    flex-direction: column;
}

.pml-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 46px;
    padding: 0 22px;
    border: 1px solid transparent;
    border-radius: 999px;
    font-size: 0.86rem;
    font-weight: 650;
    line-height: 1.25;
    text-align: center;
    text-decoration: none;
    transition: filter 0.18s ease, box-shadow 0.18s ease;
}

.pml-btn:hover,
.pml-btn:focus-visible {
    filter: brightness(0.93);
    box-shadow: 0 6px 16px rgba(11, 53, 91, 0.14);
}

/* Backgrounds */
.bg-red {
    background: #c52317;
}

.bg-navy {
    background: #0b355b;
}

.bg-ivory {
    background: #fffff0;
    border-color: rgba(11, 53, 91, 0.18);
}

.bg-white {
    background: #ffffff;
    border-color: rgba(11, 53, 91, 0.25);
}

.bg-none {
    min-height: 0;
    padding: 4px 2px;
    background: transparent;
}

.bg-none:hover,
.bg-none:focus-visible {
    filter: none;
    box-shadow: none;
    text-decoration: underline;
    text-underline-offset: 3px;
}

/* Text colours */
.tx-white {
    color: #ffffff;
}

.tx-ivory {
    color: #fffff0;
}

.tx-navy {
    color: #0b355b;
}

.tx-red {
    color: #c52317;
}

/* Fonts */
.font-heading {
    font-family: var(--ax-font-heading, inherit);
    font-weight: 400;
    letter-spacing: 0.01em;
}

.font-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: 600;
}

/* Sizes */
.size-small {
    min-height: 38px;
    padding-inline: 16px;
    font-size: 0.78rem;
}

.size-large {
    min-height: 54px;
    padding-inline: 28px;
    font-size: 1rem;
}

.bg-none.size-small,
.bg-none.size-large {
    min-height: 0;
    padding-inline: 2px;
}
</style>
