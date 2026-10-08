<template>
    <!-- "Immagine nella pagina" → "Grande, in apertura": the cover across the
         whole column, as on a success story. -->
    <figure class="meta-cover" :class="{ 'is-dark': dark }">
        <img :src="src" :alt="alt" :width="width" :height="height" decoding="async" fetchpriority="high" />
    </figure>
</template>

<script setup lang="ts">
defineProps<{ src: string; alt: string; width?: number; height?: number; dark?: boolean }>();
</script>

<style scoped>
.meta-cover {
    margin: 0 0 36px;
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.1);
    border-radius: 18px;
    background: #ffffff;
    box-shadow: 0 18px 40px rgba(17, 48, 78, 0.1);
}

.meta-cover.is-dark {
    border-color: var(--ax-color-border-soft);
    background: transparent;
    box-shadow: none;
}

.meta-cover img {
    display: block;
    width: 100%;
    height: auto;
    max-height: 460px;
    object-fit: cover;
}
</style>
