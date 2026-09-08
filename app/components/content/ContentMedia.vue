<template>
    <img
        v-if="src"
        class="content-media"
        :src="src"
        :alt="alt || title"
        width="720"
        height="440"
    />
    <div v-else class="media-placeholder">
        <span>Immagine {{ title.toLowerCase() }}</span>
        <small>Spazio predisposto per il contenuto fotografico</small>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title: string;
    src?: string;
    alt?: string;
}>();
</script>

<style scoped>
.content-media,
.media-placeholder {
    width: 100%;
    min-height: 360px;
    margin: 0 0 28px;
    border: 1px solid rgba(11, 53, 91, 0.14);
    box-shadow: 0 22px 48px rgba(17, 48, 78, 0.14);
}

.content-media {
    max-height: 420px;
    display: block;
    object-fit: cover;
}

.media-placeholder {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 8px;
    padding: 28px;
    background:
        linear-gradient(135deg, transparent 48%, rgba(197, 35, 23, 0.16) 48% 49%, transparent 49%),
        repeating-linear-gradient(90deg, rgba(42, 111, 165, 0.08) 0 1px, transparent 1px 46px),
        #edf3f8;
}

.media-placeholder span {
    color: #0b355b;
    font-size: 1.05rem;
    font-weight: 700;
}

.media-placeholder small {
    color: #667f97;
}

@media (max-width: 820px) {
    .media-placeholder {
        min-height: 260px;
    }

    .content-media {
        max-height: 360px;
        min-height: 0;
    }
}
</style>