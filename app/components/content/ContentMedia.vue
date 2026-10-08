<template>
    <!-- No image → render nothing. The old placeholder told visitors
         "Spazio predisposto per il contenuto fotografico". -->
    <figure v-if="src" class="content-media">
        <ContentResponsiveImage
            :src="src"
            :alt="alt || title"
            width="720"
            height="440"
            sizes="84vw md:40vw lg:720px"
            loading="lazy"
            decoding="async"
        />
    </figure>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    src?: string;
    alt?: string;
}>();
</script>

<style scoped>
/* Most images here are square product pictograms (Angel River, Geo Angel…).
   Shown whole on a quiet panel instead of cropped to a wide banner. Real
   photos keep their own proportions inside the same frame. */
.content-media {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 0 32px;
    padding: 28px;
    border: 1px solid rgba(11, 53, 91, 0.1);
    border-radius: 14px;
    background: linear-gradient(180deg, #ffffff 0%, #f3f7fb 100%);
}

.content-media img {
    display: block;
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: 280px;
    object-fit: contain;
}

@media (max-width: 820px) {
    .content-media {
        padding: 20px;
    }

    .content-media img {
        max-height: 200px;
    }
}
</style>
