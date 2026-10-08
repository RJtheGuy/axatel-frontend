<template>
    <NuxtImg
        v-if="canOptimize"
        :src="resolvedSrc"
        :alt="alt"
        :width="width"
        :height="height"
        :sizes="sizes"
        :densities="densities"
        :loading="loading"
        :fetchpriority="fetchpriority"
        format="webp"
        :modifiers="{ fit: 'inside' }"
        decoding="async"
    />
    <img
        v-else
        :src="resolvedSrc"
        :alt="alt"
        :width="width"
        :height="height"
        :loading="loading"
        :fetchpriority="fetchpriority"
        decoding="async"
    />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    src: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    sizes?: string;
    densities?: string;
    loading?: "lazy" | "eager";
    fetchpriority?: "high" | "low" | "auto";
}>(), {
    alt: "",
    sizes: "100vw sm:100vw md:50vw lg:720px",
    densities: "1x 2x",
    loading: "lazy",
    fetchpriority: "auto"
});

const { imageUrl } = useCmsImage();
const image = useImage();
const resolvedSrc = computed(() => imageUrl(props.src));
const canOptimize = computed(() => {
    const src = resolvedSrc.value;
    // Build assets and SVG/data images must keep their original URL.
    if (!src || src.startsWith("/_nuxt/") || /^(data:|blob:)/.test(src) || /\.svg(?:[?#]|$)/i.test(src)) return false;
    if (/^(https?:)?\/\//.test(src)) {
        const url = new URL(src, "https://localhost");
        return image.options.domains.includes(url.host);
    }
    return !src.startsWith("/media/") || Boolean(image.options.alias["/media"]);
});
</script>
