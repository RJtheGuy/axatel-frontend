<template>
    <section ref="sectionEl" class="citazione-section">
        <div class="hero-grid" aria-hidden="true"></div>

        <div class="hero-copy">
            <p class="hero-kicker">Tecnologia che protegge</p>
            <h1>Sistemi di monitoraggio <span>real-time</span> per la mitigazione del rischio</h1>
            <p class="hero-intro">
                Dati, automazione e controllo continuo per anticipare gli eventi e proteggere
                infrastrutture, territori e persone.
            </p>

            <div class="hero-status" aria-label="Monitoraggio attivo">
                <span class="status-dot"></span>
                <span>Monitoraggio attivo</span>
                <span class="status-separator"></span>
                <span>24 / 7</span>
            </div>
        </div>

        <div class="guardian" aria-hidden="true">
            <div class="guardian-orbit guardian-orbit-outer"></div>
            <div class="guardian-orbit guardian-orbit-inner"></div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

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
    height: 100vh;
    min-height: 700px;
    isolation: isolate;
    background: transparent;
    overflow: hidden;
}

.citazione-section::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background-image: radial-gradient(circle, rgba(126, 205, 247, 0.42) 0 1px, transparent 1.5px);
    background-size: 30px 30px;
    mask-image: linear-gradient(90deg, transparent, #000 34%, #000 100%);
    opacity: 0.35;
}

.citazione-section::after {
    content: "";
    position: absolute;
    right: -12vw;
    bottom: -42vh;
    width: 72vw;
    height: 72vw;
    border: 1px solid rgba(112, 198, 244, 0.12);
    border-radius: 50%;
    pointer-events: none;
}

.hero-grid {
    position: absolute;
    inset: auto 0 0;
    height: 28vh;
    background:
        linear-gradient(rgba(92, 173, 218, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(92, 173, 218, 0.08) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: linear-gradient(transparent, #000);
    transform: perspective(420px) rotateX(58deg) scale(1.35);
    transform-origin: bottom;
    opacity: 0.5;
}

.hero-copy {
    position: relative;
    z-index: 3;
    display: flex;
    width: min(58vw, 820px);
    height: 100%;
    padding: 15vh 0 12vh clamp(36px, 8vw, 140px);
    flex-direction: column;
    justify-content: center;
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
    max-width: 790px;
    margin: 0;
    color: #fff;
    font-size: clamp(3rem, 5.6vw, 6.4rem);
    font-weight: 220 !important;
    line-height: 0.98;
    letter-spacing: 0;
    text-wrap: balance;
}

.hero-copy h1 span {
    color: #8bd9ff;
    font-weight: 380;
}

.hero-intro {
    max-width: 610px;
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

.guardian {
    position: absolute;
    z-index: 2;
    top: 50%;
    right: -3vw;
    width: min(55vw, 900px);
    aspect-ratio: 1.25;
    transform: translateY(-48%);
}

.guardian-orbit {
    position: absolute;
    border: 1px solid rgba(114, 204, 251, 0.2);
    border-radius: 50%;
}

.guardian-orbit-outer {
    inset: 4%;
    animation: orbitSpin 28s linear infinite;
}

.guardian-orbit-outer::before,
.guardian-orbit-inner::before {
    content: "";
    position: absolute;
    top: 50%;
    left: -4px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #7bd4ff;
    box-shadow: 0 0 14px rgba(123, 212, 255, 0.9);
}

.guardian-orbit-inner {
    inset: 15%;
    border-style: dashed;
    opacity: 0.52;
    animation: orbitSpin 20s linear infinite reverse;
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

@keyframes orbitSpin {
    to { transform: rotate(360deg); }
}

@keyframes statusPulse {
    50% { opacity: 0.45; }
}

@media (max-width: 900px) {
    .citazione-section {
        min-height: 760px;
    }

    .hero-copy {
        width: 72vw;
        padding-left: 7vw;
    }

    .guardian {
        right: -22vw;
        width: 72vw;
        opacity: 0.6;
    }
}

@media (max-width: 640px) {
    .citazione-section {
        height: 100svh;
        min-height: 680px;
    }

    .hero-copy {
        width: 100%;
        padding: 110px 7vw 110px;
        justify-content: flex-end;
    }

    .hero-copy h1 {
        max-width: 94%;
        font-size: clamp(2.5rem, 12vw, 4rem);
    }

    .hero-intro {
        max-width: 92%;
        font-size: 0.94rem;
    }

    .guardian {
        top: 25%;
        right: -18vw;
        width: 96vw;
        opacity: 0.42;
    }
}

</style>
