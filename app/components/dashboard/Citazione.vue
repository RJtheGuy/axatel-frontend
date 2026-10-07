<template>
    <section ref="sectionEl" class="citazione-section">
        <video class="hero-video" autoplay muted loop playsinline preload="metadata" :poster="heroPosterUrl" aria-hidden="true" ref="videoEl">
            <source :src="heroVideoUrl" type="video/mp4" />
        </video>
        <div class="hero-video-overlay" aria-hidden="true"></div>

        <div class="hero-copy">
            <p v-if="text.kicker" class="hero-kicker">{{ text.kicker }}</p>
            <h1>{{ text.titleBefore }} <span>{{ text.titleAccent }}</span> {{ text.titleAfter }}</h1>
            <p v-if="text.intro" class="hero-intro">{{ text.intro }}</p>

            <div class="hero-actions">
                <NuxtLink :to="link(text.primaryUrl)" class="hero-btn hero-btn-primary">{{ text.primaryLabel }}</NuxtLink>
                <NuxtLink v-if="text.secondaryLabel" :to="link(text.secondaryUrl)" class="hero-btn hero-btn-ghost">{{ text.secondaryLabel }} <span aria-hidden="true">→</span></NuxtLink>
            </div>

           <!-- <div v-if="text.showStatus" class="hero-status" :aria-label="t('hero.status')">
                <span class="status-dot"></span>
                <span>{{ t("hero.status") }}</span>
                <span class="status-separator"></span>
                <span>24 / 7</span>
            </div> -->
        </div>

    </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import heroVideoUrl from "@/assets/video/video_hero.mp4";
// First frame of the video: shown until the video plays, so the hero is
// never a dark empty box.
import heroPosterUrl from "@/assets/video/hero-poster.webp";

// Texts of the first screen: Pagine → Home → "Prima schermata" in the CMS;
// anything left empty there uses the built-in text in the visitor's language.
export type HeroTop = {
    kicker?: string; titleBefore?: string; titleAccent?: string; titleAfter?: string; intro?: string;
    primaryLabel?: string; primaryUrl?: string; secondaryLabel?: string; secondaryUrl?: string; showStatus?: boolean;
};
const props = defineProps<{ content?: HeroTop | null }>();

const { t } = useI18n();
const localePath = useLocalePath();

const pick = (value: string | undefined, fallback: string) => (value && value.trim() ? value.trim() : fallback);
const text = computed(() => {
    const c = props.content ?? {};
    const secondary = pick(c.secondaryLabel, t("hero.ctaSecondary"));
    return {
        // The kicker line shows only when one is written in the CMS
        // (the new video hero has none by default).
        kicker: c.kicker && c.kicker.trim() !== "-" ? c.kicker.trim() : "",
        titleBefore: pick(c.titleBefore, t("hero.titleBefore")),
        titleAccent: pick(c.titleAccent, t("hero.titleAccent")),
        titleAfter: pick(c.titleAfter, t("hero.titleAfter")),
        intro: pick(c.intro, t("hero.intro")),
        primaryLabel: pick(c.primaryLabel, t("hero.ctaPrimary")),
        primaryUrl: pick(c.primaryUrl, "/contatti"),
        // A single "-" in the CMS hides the second button.
        secondaryLabel: secondary === "-" ? "" : secondary,
        secondaryUrl: pick(c.secondaryUrl, "/monitoraggio"),
        showStatus: c.showStatus !== false,
    };
});
const link = (url: string) => (url.startsWith("/") ? localePath(url) : url);

const sectionEl = ref<HTMLElement | null>(null);
const videoEl = ref<HTMLVideoElement | null>(null);
let observer: IntersectionObserver | null = null;

function emitQuoteVisibility(active: boolean): void {
    window.dispatchEvent(
        new CustomEvent("axatel-quote-visibility", {
            detail: { active }
        })
    );
}

// The "autoplay" attribute alone only works reliably on a full page load.
// When the visitor comes back to the homepage by clicking a link (the logo,
// the menu), the video is created by JavaScript and browsers may leave it
// stopped. So the page starts it itself: muted (required for autoplay), and
// again on the first click, tap, key or scroll if the browser refused, or
// when the tab becomes visible again.
const UNLOCK_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
let reducedMotion = false;

function startVideo(): void {
    const video = videoEl.value;
    if (!video || reducedMotion || !video.paused) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
        attempt.then(removeUnlock).catch(addUnlock);
    }
}

function addUnlock(): void {
    for (const name of UNLOCK_EVENTS) window.addEventListener(name, startVideo, { passive: true, once: true });
}

function removeUnlock(): void {
    for (const name of UNLOCK_EVENTS) window.removeEventListener(name, startVideo);
}

function onVisibility(): void {
    if (document.visibilityState === "visible") startVideo();
}

onMounted(() => {
    // Visitors who ask for less motion see the first frame, not a loop.
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (videoEl.value && reducedMotion) {
        videoEl.value.pause();
    } else if (videoEl.value) {
        videoEl.value.addEventListener("canplay", startVideo);
        startVideo();
        document.addEventListener("visibilitychange", onVisibility);
    }
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
    removeUnlock();
    document.removeEventListener("visibilitychange", onVisibility);
    videoEl.value?.removeEventListener("canplay", startVideo);
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

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 34px;
}

.hero-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 24px;
    border-radius: 999px;
    font-size: 0.86rem;
    font-weight: 650;
    letter-spacing: 0.03em;
    text-decoration: none;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.hero-btn-primary {
    color: #fff;
    background: var(--ax-color-accent-red);
    box-shadow: 0 12px 28px rgba(197, 35, 23, 0.32);
}

.hero-btn-primary:hover {
    background: var(--ax-color-accent-red-soft);
    transform: translateY(-1px);
}

.hero-btn-ghost {
    color: var(--ax-color-text-primary);
    border: 1px solid rgba(198, 220, 239, 0.32);
    background: rgba(2, 7, 18, 0.35);
}

.hero-btn-ghost:hover {
    border-color: rgba(198, 220, 239, 0.7);
}

.hero-btn:focus-visible {
    outline: 2px solid #8bd9ff;
    outline-offset: 3px;
}

@media (max-width: 640px) {
    .hero-actions {
        margin-top: 26px;
    }

    .hero-btn {
        min-height: 46px;
        padding: 0 20px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .hero-btn,
    .hero-btn:hover {
        transition: none;
        transform: none;
    }
}

</style>
