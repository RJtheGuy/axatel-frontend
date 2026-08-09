<template>
    <figure class="cms-video">
        <!-- EmbedBlock serializes full oEmbed data, not a bare URL.
             The playable iframe markup is in value.embed.html. -->
        <div v-if="embedHtml" class="video-frame" v-html="embedHtml"></div>
        <a v-else-if="embedUrl" :href="embedUrl" target="_blank" rel="noopener noreferrer">
            {{ embedUrl }}
        </a>
        <figcaption v-if="value.caption" v-html="value.caption"></figcaption>
    </figure>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
    value: { embed?: any; caption?: string };
}>();

const embedHtml = computed(() => {
    const e = props.value.embed;
    if (!e) return null;
    return typeof e === "object" ? e.html ?? null : null;
});

const embedUrl = computed(() => {
    const e = props.value.embed;
    if (!e) return null;
    return typeof e === "string" ? e : e.url ?? null;
});
</script>

<style scoped>
.cms-video {
    max-width: 900px;
    margin: 48px auto;
    padding: 0 8vw;
}

.video-frame {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    border-radius: var(--ax-card-radius);
    border: 1px solid var(--ax-color-border-soft);
}

.video-frame :deep(iframe) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
}

figcaption {
    margin-top: 12px;
    color: var(--ax-color-text-muted);
    font-size: 0.86rem;
    text-align: center;
}

figcaption :deep(p) {
    margin: 0;
}
</style>
