<template>
    <section ref="sectionEl" class="citazione-section">
        <video class="hero-video" autoplay muted loop playsinline preload="metadata" aria-hidden="true">
            <source :src="heroVideoUrl" type="video/mp4" />
        </video>
        <div class="hero-video-overlay" aria-hidden="true"></div>

        <div class="hero-copy">
            <!-- <p class="hero-kicker">Tecnologia che protegge</p> -->
            <h1>Sistemi di monitoraggio <span>real-time</span> per la riduzione del rischio</h1>
            <p class="hero-intro">
                Dati, automazione e controllo continuo per anticipare gli eventi e proteggere
                infrastrutture, territori e persone.
            </p>

            <!-- <div class="hero-status" aria-label="Monitoraggio attivo">
                <span class="status-dot"></span>
                <span>Monitoraggio attivo</span>
                <span class="status-separator"></span>
                <span>24 / 7</span>
            </div> -->
        </div>

    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import heroVideoUrl from "@/assets/video/video_hero.mp4";

const sectionEl = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

function emitQuoteVisibility(active: boolean): void {
    window.dispatchEvent(
        new CustomEvent("axatel-quote-visibility", {
            detail: { active }
        })
    );
}

onMounted(() => {
    if (!sectionEl.value) return;

    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            if (!entry) return;

            const active = entry.isIntersecting && entry.intersectionRatio > 0.55;
            emitQuoteVisibility(active);
        },
        {
            threshold: [0, 0.25, 0.55, 0.8, 1]
        }
    );

    observer.observe(sectionEl.value);
});

onBeforeUnmount(() => {
    observer?.disconnect();
    emitQuoteVisibility(false);
});
</script>

<style scoped>
.citazione-section {
    position: relative;
    z-index: 1;
    width: 100vw;
    height: auto;
    min-height: max(100vh, calc(50vh + 460px));
    min-height: 700px;
    isolation: isolate;
    background: #020712;
    overflow: hidden;
}

.hero-video,
.hero-video-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.hero-video {
    z-index: -2;
    object-fit: cover;
    object-position: center;
}

.hero-video-overlay {
    z-index: -1;
    background:
        linear-gradient(90deg, rgba(2, 7, 18, 0.58), rgba(2, 9, 18, 0.28) 62%, rgba(2, 9, 18, 0.14)),
        linear-gradient(0deg, rgba(2, 7, 18, 0.46), transparent 72%);
}

.citazione-section::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: linear-gradient(0deg, rgba(2, 7, 18, 0.12), transparent 40%);
}

.hero-copy {
    position: relative;
    z-index: 1;
    display: flex;
    width: min(92vw, 1400px);
    min-height: max(100vh, calc(50vh + 460px));
    height: auto;
    padding: 50vh 0 5vh clamp(36px, 8vw, 140px);
    flex-direction: column;
    justify-content: flex-start;
}

.hero-kicker {
    margin: 0 0 20px;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.76rem;
    font-weight: 550;
    letter-spacing: 0.18em;
    text-transform: uppercase;
}

.hero-copy h1 {
    max-width: 1100px;
    margin: 0;
    color: #fff;
    font-size: clamp(2.5rem, 4.5vw, 5.2rem);
    font-weight: 220 !important;
    line-height: 0.98;
    letter-spacing: 0;
    text-wrap: balance;
}

.hero-copy h1 span {
    color: #ca3d33;
    font-weight: 380;
    white-space: nowrap;
}

.hero-intro {
    max-width: 900px;
    margin: 28px 0 0;
    color: var(--ax-color-text-secondary);
    font-size: clamp(1rem, 1.2vw, 1.18rem);
    font-weight: 320;
    line-height: 1.65;
}

.hero-status {
    display: flex;
    margin-top: 34px;
    align-items: center;
    gap: 10px;
    color: var(--ax-color-text-muted);
    font-size: 0.7rem;
    font-weight: 450;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ce6a4;
    box-shadow: 0 0 14px rgba(76, 230, 164, 0.9);
    animation: statusPulse 2s ease-in-out infinite;
}

.status-separator {
    width: 30px;
    height: 1px;
    margin: 0 4px;
    background: rgba(198, 220, 239, 0.28);
}

.hero-index {
    position: absolute;
    right: 3vw;
    bottom: 28px;
    left: 3vw;
    z-index: 3;
    display: flex;
    justify-content: space-between;
    color: rgba(198, 220, 239, 0.48);
    font-size: 0.62rem;
    font-weight: 450;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

@keyframes statusPulse {
    50% { opacity: 0.45; }
}

@media (max-width: 900px) {
    .citazione-section {
        min-height: 760px;
    }

    .hero-copy {
        width: 78vw;
        padding-left: 7vw;
        min-height: max(100vh, calc(50vh + 460px));
    }
}

@media (max-width: 640px) {
    .citazione-section {
        min-height: max(680px, 100svh, calc(50svh + 500px));
    }

    .hero-copy {
        width: 100%;
        padding: 50svh 7vw max(32px, 5svh);
        min-height: max(100svh, calc(50svh + 500px));
    }

    .hero-copy h1 {
        max-width: 94%;
        font-size: clamp(2.2rem, 9vw, 3.2rem);
    }

    .hero-intro {
        max-width: 92%;
        font-size: 1.4rem;
    }

}

</style>
