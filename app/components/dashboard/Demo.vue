<template>
    <section
        ref="sectionEl"
        class="demo-section"
        tabindex="-1"
    >

        <div class="demo-content" :inert="!introDismissed">

            <DashboardDemoAngel
                :alarm-event="alarmEvent"
            />

            <DashboardDemoCaroselloVerticali
                :applications="applications"
                @alarm="onAlarm"
                @normal="onNormal"
            />

        </div>

        <Transition name="demo-intro">
            <button
                v-if="!introDismissed"
                ref="introEl"
                class="demo-intro-overlay"
                type="button"
                aria-label="Prova AngelBPM: scopri le demo interattive"
                @click="dismissIntro"
            >
                <span class="demo-intro-copy">
                    <span class="demo-intro-brand">
                        <ContentResponsiveImage :src="angelBpmLogo" alt="" width="280" height="212" sizes="100px sm:20vw lg:280px" />
                        <span class="demo-intro-title">AngelBPM</span>
                    </span>
                    <span class="demo-intro-invitation">
                        Prova il sistema: interagisci con le demo e scopri come
                        ogni evento diventa un allarme in tempo reale.
                    </span>
                    <span class="demo-intro-hint">Tocca o clicca ovunque per iniziare</span>
                </span>
            </button>
        </Transition>

    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue"
const angelBpmLogo = "/immagini/angel_bpm.webp"

const sectionEl = ref<HTMLElement | null>(null)
const introEl = ref<HTMLButtonElement | null>(null)
const introDismissed = ref(false)
let introObserver: IntersectionObserver | null = null
let introTimeout: ReturnType<typeof setTimeout> | null = null
let introAcknowledged = false
let demoVisible = false

function clearIntroTimeout(): void {
    if (introTimeout === null) return
    clearTimeout(introTimeout)
    introTimeout = null
}

function hideIntro(): void {
    const restoreFocus = document.activeElement === introEl.value
    introDismissed.value = true
    clearIntroTimeout()
    if (restoreFocus) sectionEl.value?.focus({ preventScroll: true })
}

function dismissIntro(): void {
    if (introAcknowledged) return
    introAcknowledged = true
    introObserver?.disconnect()
    hideIntro()
}

onMounted(() => {
    if (!sectionEl.value) return

    introObserver = new IntersectionObserver((entries) => {
        if (introAcknowledged) return
        const visible = entries.some(entry => entry.isIntersecting)
        if (visible === demoVisible) return
        demoVisible = visible
        clearIntroTimeout()
        if (!visible) return

        introDismissed.value = false
        introTimeout = setTimeout(hideIntro, 9000)
    }, { rootMargin: "0px 0px -35% 0px", threshold: 0 })
    introObserver.observe(sectionEl.value)
})

onBeforeUnmount(() => {
    introObserver?.disconnect()
    clearIntroTimeout()
})

type DemoApplication = {
    name: string;
    description: string;
    demo: string | null;
    instruction?: string;
};

type AlarmEvent = {
    application: string;
    origin: { x: number; y: number };
    getOrigin: () => { x: number; y: number };
};

const props = defineProps<{
    applications?: DemoApplication[];
}>();

const defaultApplications: DemoApplication[] = [
    {
        name: "Geo Angel",
        description: "Monitoraggio geologico",
        demo: "GeoAngel",
        instruction: "Colpisci il sensore col mouse per generare l'impatto"
    },
    {
        name: "Traffic Alert",
        description: "Traffico intelligente",
        demo: "TrafficAlert",
        instruction: "Passa il mouse sulla card per aumentare il traffico fino alla congestione"
    },
    {
        name: "Angel River",
        description: "Monitoraggio di fiumi",
        demo: "AngelRiver",
        instruction: "Passa il mouse sulla card per simulare la pioggia e far salire il livello"
    },
    {
        name: "Angel Road Site",
        description: "Gestione cantieri",
        demo: "AngelRoadSite",
        instruction: "Colpisci col mouse il cartello lavori in corso per far scattare l'allarme"
    },
    {
        name: "Angel Bridge",
        description: "Monitoraggio ponti",
        demo: "AngelBridge",
        instruction: "Passa il mouse sulla card per aprire la crepa"
    }
];

const applications = (props.applications && props.applications.length > 0)
    ? props.applications
    : defaultApplications;

const alarmEvent = ref<AlarmEvent | null>(null)

function onAlarm(payload: AlarmEvent){
    alarmEvent.value = payload
}

function onNormal(){
    // The latest event remains available until the next alarm is emitted.
}
</script>

<style scoped>
.demo-section {
    position: relative;
    width: 100vw;
    min-height: 100dvh;
    overflow: hidden;
    background: transparent;
}

.demo-content {
    position: relative;
    z-index: 1;
}

.demo-intro-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: rgba(2, 7, 18, 0.62);
    color: #fff;
    text-align: center;
    cursor: pointer;
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
}

.demo-intro-overlay:focus-visible {
    outline: 2px solid #fff;
    outline-offset: -8px;
}

.demo-intro-copy {
    position: sticky;
    top: var(--ax-navbar-height, 74px);
    display: flex;
    min-height: calc(100svh - var(--ax-navbar-height, 74px));
    padding: clamp(32px, 6vh, 80px) 6vw;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.demo-intro-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(16px, 3vw, 48px);
}

.demo-intro-brand img {
    display: block;
    width: clamp(100px, 20vw, 280px);
    height: auto;
    flex-shrink: 0;
    filter: brightness(0) invert(1);
}

.demo-intro-title {
    color: #fff;
    font-size: clamp(2.4rem, 8vw, 8rem);
    font-weight: 350;
    line-height: 1.05;
    letter-spacing: -0.03em;
}

.demo-intro-invitation {
    max-width: 740px;
    margin-top: 36px;
    color: #fff;
    font-size: clamp(1rem, 1.7vw, 1.4rem);
    font-weight: 400;
    line-height: 1.6;
}

.demo-intro-hint {
    margin-top: 24px;
    color: #fff;
    font-size: 0.85rem;
    line-height: 1.5;
}

.demo-intro-leave-active {
    transition: opacity 350ms ease;
}

.demo-intro-leave-to {
    opacity: 0;
    pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
    .demo-intro-leave-active {
        transition: none;
    }
}

@media (max-width: 480px) {
    .demo-intro-brand img {
        width: 24vw;
    }

    .demo-intro-title {
        font-size: 10vw;
    }
}

@media (max-width: 900px) {
    .demo-section {
        min-height: 100vh;
    }
}
</style>