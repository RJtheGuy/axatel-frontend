<template>
    <!-- "In preparazione" panel for pages that exist in the menu but have no
         content yet (built-in Academy/FAQ, or a CMS topic with an empty body).
         Same visual language as the cards on Monitoraggio and Casi di successo. -->
    <section class="soon-wrap" :aria-labelledby="headingId">
    <div class="soon">
        <div class="soon-copy">
            <p class="soon-badge"><span class="soon-dot" aria-hidden="true"></span>{{ t("comingSoon.status") }}</p>
            <p v-if="kicker" class="soon-kicker">{{ kicker }}</p>
            <h2 :id="headingId">{{ t("comingSoon.title") }}</h2>
            <p class="soon-text">{{ text || t("comingSoon.text") }}</p>
            <div class="soon-actions">
                <NuxtLink :to="localePath('/contatti')" class="soon-btn soon-btn--primary">{{ t("comingSoon.cta") }}</NuxtLink>
                <NuxtLink :to="localePath('/monitoraggio')" class="soon-btn">{{ t("comingSoon.explore") }} <span aria-hidden="true">→</span></NuxtLink>
            </div>
        </div>
        <!-- A monitoring "radar": drawn here, so it never depends on uploaded images. -->
        <div class="soon-art" aria-hidden="true">
            <svg viewBox="0 0 200 200" class="soon-radar">
                <circle cx="100" cy="100" r="92" class="ring" />
                <circle cx="100" cy="100" r="64" class="ring" />
                <circle cx="100" cy="100" r="36" class="ring" />
                <line x1="100" y1="8" x2="100" y2="192" class="axis" />
                <line x1="8" y1="100" x2="192" y2="100" class="axis" />
                <g class="sweep">
                    <path d="M100 100 L100 8 A92 92 0 0 1 165 35 Z" class="beam" />
                    <line x1="100" y1="100" x2="100" y2="8" class="beam-edge" />
                </g>
                <circle cx="142" cy="62" r="5" class="blip" />
                <circle cx="66" cy="132" r="4" class="blip blip--late" />
                <circle cx="100" cy="100" r="6" class="core" />
            </svg>
        </div>
    </div>
    </section>
</template>

<script setup lang="ts">
import { useId } from "vue";

defineProps<{
    kicker?: string;
    text?: string;
}>();
const { t } = useI18n();
const localePath = useLocalePath();
const headingId = `soon-${useId()}`;
</script>

<style scoped>
.soon-wrap {
    container-type: inline-size;
    margin: 8px 0 12px;
}

.soon {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: center;
    gap: 32px;
    padding: 36px 40px;
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background:
        radial-gradient(circle at 92% 50%, rgba(42, 111, 165, 0.12), transparent 45%),
        linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
}

.soon::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: #c52317;
}

.soon-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 18px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(11, 53, 91, 0.9);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.soon-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ea3f30;
    box-shadow: 0 0 0 0 rgba(234, 63, 48, 0.6);
    animation: soon-pulse 2s ease-out infinite;
}

@keyframes soon-pulse {
    70% { box-shadow: 0 0 0 8px rgba(234, 63, 48, 0); }
    100% { box-shadow: 0 0 0 0 rgba(234, 63, 48, 0); }
}

.soon-kicker {
    margin: 0 0 6px;
    color: #c52317;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.soon h2 {
    margin: 0;
    color: #0b355b;
    font-size: clamp(1.45rem, 2.4vw, 1.9rem);
    line-height: 1.15;
}

.soon-text {
    max-width: 560px;
    margin: 14px 0 0;
    color: #274e72;
    font-size: 1.04rem;
    line-height: 1.6;
}

.soon-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 26px;
}

.soon-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 20px;
    border: 1px solid rgba(11, 53, 91, 0.24);
    border-radius: 999px;
    background: #fff;
    color: #0b355b;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
    transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.soon-btn:hover {
    border-color: #c52317;
}

.soon-btn--primary {
    border-color: #c52317;
    background: #c52317;
    color: #fff;
}

.soon-btn--primary:hover {
    background: #ea3f30;
}

.soon-btn:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: 2px;
}

.soon-art {
    width: 220px;
    height: 220px;
    justify-self: end;
    padding: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 45%, #0f3f6b 0%, #071a2e 72%);
    box-shadow: 0 18px 40px rgba(7, 26, 46, 0.25);
}

.soon-radar {
    width: 100%;
    height: 100%;
    display: block;
}

.soon-radar .ring,
.soon-radar .axis {
    fill: none;
    stroke: rgba(139, 217, 255, 0.28);
    stroke-width: 1;
}

.soon-radar .beam {
    fill: rgba(139, 217, 255, 0.18);
}

.soon-radar .beam-edge {
    stroke: rgba(139, 217, 255, 0.85);
    stroke-width: 1.5;
}

.soon-radar .sweep {
    transform-origin: 100px 100px;
    animation: soon-spin 6s linear infinite;
}

.soon-radar .blip {
    fill: #ea3f30;
    animation: soon-blink 3s ease-in-out infinite;
}

.soon-radar .blip--late {
    fill: #8bd9ff;
    animation-delay: 1.5s;
}

.soon-radar .core {
    fill: #8bd9ff;
}

@keyframes soon-spin {
    to { transform: rotate(360deg); }
}

@keyframes soon-blink {
    0%, 100% { opacity: 0.25; }
    50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
    .soon-dot,
    .soon-radar .sweep,
    .soon-radar .blip {
        animation: none;
    }
}

/* Narrower column (a topic page) → smaller radar; phone → text only. */
@container (max-width: 820px) {
    .soon {
        grid-template-columns: minmax(0, 1fr) 150px;
        gap: 24px;
        padding: 30px 28px;
    }

    .soon-art {
        width: 150px;
        height: 150px;
    }
}

@container (max-width: 560px) {
    .soon {
        grid-template-columns: 1fr;
        padding: 26px 22px;
    }

    .soon-art {
        display: none;
    }
}
</style>
