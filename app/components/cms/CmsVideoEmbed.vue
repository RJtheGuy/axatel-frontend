<template>
    <figure class="cms-video">
        <!-- Privacy: nothing is loaded from YouTube/Vimeo until the visitor
             presses play (no third-party cookies, so no cookie banner is
             needed). YouTube then plays from youtube-nocookie.com and Vimeo
             with "do not track". -->
        <div v-if="player" class="video-frame">
            <iframe
                v-if="playing"
                :src="player.src"
                :title="title"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
            <button v-else type="button" class="video-cover" @click="playing = true">
                <span class="video-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </span>
                <span class="video-title">{{ title }}</span>
                <span class="video-note">{{ t("video.notice", { service: player.service }) }}</span>
            </button>
        </div>
        <a v-else-if="embedUrl" :href="embedUrl" target="_blank" rel="noopener noreferrer">
            {{ embedUrl }}
        </a>
        <figcaption v-if="value.caption" v-html="value.caption"></figcaption>
    </figure>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
    value: { embed?: any; caption?: string };
}>();
const { t } = useI18n();
const playing = ref(false);

const embedUrl = computed(() => {
    const e = props.value.embed;
    if (!e) return null;
    return typeof e === "string" ? e : e.url ?? null;
});

const title = computed(() => {
    const e = props.value.embed;
    return (typeof e === "object" && e?.title) || t("video.play");
});

// The original address, or the one inside the oEmbed iframe.
const sourceUrl = computed(() => {
    const e = props.value.embed;
    const html = typeof e === "object" ? String(e?.html || "") : "";
    return embedUrl.value || html.match(/src="([^"]+)"/)?.[1] || "";
});

const player = computed(() => {
    const url = sourceUrl.value;
    const youtube = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    if (/youtu/.test(url) && youtube) {
        return { service: "YouTube", src: `https://www.youtube-nocookie.com/embed/${youtube[1]}?autoplay=1&rel=0` };
    }
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) {
        return { service: "Vimeo", src: `https://player.vimeo.com/video/${vimeo[1]}?dnt=1&autoplay=1` };
    }
    return null;
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
    background: radial-gradient(circle at 50% 40%, #0f3f6b 0%, #071a2e 75%);
}

.video-frame iframe,
.video-cover {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
}

.video-cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    background: transparent;
    color: #fff;
    font: inherit;
    cursor: pointer;
}

.video-play {
    display: grid;
    width: 72px;
    height: 72px;
    place-items: center;
    border-radius: 50%;
    background: #c52317;
    box-shadow: 0 10px 30px rgba(197, 35, 23, 0.4);
    transition: transform 0.2s ease;
}

.video-play svg {
    width: 34px;
    height: 34px;
    fill: #fff;
}

.video-cover:hover .video-play {
    transform: scale(1.06);
}

.video-cover:focus-visible {
    outline: 2px solid #8bd9ff;
    outline-offset: -4px;
}

.video-title {
    max-width: 80%;
    font-weight: 700;
    text-align: center;
}

.video-note {
    max-width: 80%;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.78rem;
    text-align: center;
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
