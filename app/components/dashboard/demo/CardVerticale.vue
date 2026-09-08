<template>

<div
    ref="cardEl"
    class="card"
    @pointerenter="mountDemo"
    @focusin="mountDemo"
>

    <div class="card-header">

        <div class="logo">

            <img
                v-if="logo"
                :src="logo"
                :alt="application.name"
                width="46"
                height="46"
                loading="lazy"
                decoding="async"
            />
        </div>

        <div class="header-info">

            <h2>
                {{ application.name }}
            </h2>
            <p>
                {{ application.description }}
            </p>

        </div>

    </div>

    <div class="card-game">

        <div
            v-if="showAlarmStrip"
            ref="alarmStripEl"
            class="alarm-strip"
            role="status"
            aria-live="polite"
        >
            allarme inviato
        </div>

        <Suspense v-if="activeDemoComponent">

            <component
                :is="activeDemoComponent"
                @alarm="onAlarm"
                @normal="onNormal"
            />

            <template #fallback>

                <div class="loading">

                    Caricamento...

                </div>

            </template>

        </Suspense>

        <div
            v-else-if="hasDemo"
            class="loading"
        >

            Preparazione demo...

        </div>

        <div
            v-else
            class="no-demo"
        >

            <span>

                Demo disponibile prossimamente

            </span>

        </div>

    </div>

    <div class="card-footer">

        <p class="text-secondary text-center instruction-text instruction-desktop">

            {{ instruction }}

        </p>

        <p class="text-center instruction-text instruction-mobile">

            {{ mobileInstruction }}

        </p>

    </div>

</div>

</template>

<script setup lang="ts">
import {
    ref,
    computed,
    nextTick,
    onMounted,
    onBeforeUnmount,
    defineAsyncComponent,
    type Component
} from "vue"

const props = defineProps<{
    application:{
        name:string
        description:string
        demo:string | null
        instruction?: string
        logo?: string
    }
    lazyIndex?: number
}>()

const emit = defineEmits<{
    (e:"alarm", payload:{ application:string; origin:{ x:number; y:number }; getOrigin:()=>{ x:number; y:number } }):void
    (e:"normal", application:string):void
}>()

const showAlarmStrip = ref(false)
const shouldMountDemo = ref(false)
const cardEl = ref<HTMLElement | null>(null)
const alarmStripEl = ref<HTMLElement | null>(null)
let alarmStripTimer: ReturnType<typeof setTimeout> | null = null
let mountObserver: IntersectionObserver | null = null
let mountTimer: ReturnType<typeof setTimeout> | null = null
let mountRaf = 0

const demoComponents:Record<string,Component>={

    GeoAngel:defineAsyncComponent(
        ()=>import("./gioco/GeoAngel.vue")
    ),

    AngelRiver:defineAsyncComponent(
        ()=>import("./gioco/AngelRiver.vue")
    ),

    AngelBridge:defineAsyncComponent(
        ()=>import("./gioco/AngelBridge.vue")
    ),

    AngelRoadSite:defineAsyncComponent(
        ()=>import("./gioco/AngelRoadSite.vue")
    ),

    TrafficAlert:defineAsyncComponent(
        ()=>import("./gioco/TrafficAlert.vue")
    )

}

const demoLogos: Record<string, string> = {
    GeoAngel: "/immagini/GeoAngel.png",
    TrafficAlert: "/immagini/TrafficAlert.png",
    AngelRiver: "/immagini/AngelRiver.png",
    AngelRoadSite: "/immagini/AngelRoadsite.png",
    AngelBridge: "/immagini/AngelBridge.png"
}

const hasDemo = computed(() => Boolean(props.application.demo && demoComponents[props.application.demo]))

const activeDemoComponent = computed(() => {

    if (!shouldMountDemo.value || !props.application.demo)
        return null

    return demoComponents[
        props.application.demo
    ] ?? null

})

function mountDemo(){
    if (shouldMountDemo.value || !hasDemo.value) return

    if (mountTimer) {
        clearTimeout(mountTimer)
        mountTimer = null
    }

    if (mountRaf) {
        cancelAnimationFrame(mountRaf)
    }

    mountObserver?.disconnect()
    mountObserver = null

    mountRaf = requestAnimationFrame(() => {
        mountRaf = 0
        shouldMountDemo.value = true
    })
}

function queueDemoMount(){
    if (shouldMountDemo.value || mountTimer || !hasDemo.value) return

    const index = props.lazyIndex ?? 0
    if (index < 5) {
        shouldMountDemo.value = true
        mountObserver?.disconnect()
        mountObserver = null
        return
    }

    const delay = (index - 4) * 180
    mountTimer = setTimeout(mountDemo, delay)
}

const logo = computed(() => {

    if (props.application.logo) {
        return props.application.logo
    }

    if (props.application.demo) {
        return demoLogos[props.application.demo] ?? null
    }

    return null

})

const instruction = computed(() => {

    if (props.application.instruction) {
        return props.application.instruction
    }

    switch (props.application.demo) {

        case "GeoAngel":
            return "Colpisci il sensore col mouse per generare l'impatto"

        case "AngelRiver":
            return "Passa il mouse sulla card per simulare la pioggia e far salire il livello"

        case "AngelBridge":
            return "Passa il mouse sulla card per aprire la crepa"

        case "AngelRoadSite":
            return "Colpisci col mouse il cartello lavori in corso per far scattare l'allarme"

        case "TrafficAlert":
            return "Passa il mouse sulla card per aumentare il traffico fino alla congestione"

        default:
            return ""

    }

})

const mobileInstruction = computed(() => {

    switch (props.application.demo) {

        case "GeoAngel":
            return "Scorri rapidamente il dito attraverso il sensore centrale"

        case "AngelRiver":
            return "Tieni premuto sulla demo per far piovere e alzare il livello"

        case "AngelBridge":
            return "Tieni premuto sulla demo per aprire la crepa"

        case "AngelRoadSite":
            return "Scorri rapidamente il dito sul cartello per generare l'impatto"

        case "TrafficAlert":
            return "Tieni premuto sulla demo per aumentare il traffico"

        default:
            return props.application.instruction ?? "Tocca la demo per interagire"

    }

})

async function onAlarm(){

    showAlarmStrip.value = true
    await nextTick()

    const getOrigin = () => {
        const source = alarmStripEl.value
            ?? cardEl.value?.querySelector<HTMLElement>(".card-game")
            ?? cardEl.value
        const rect = source?.getBoundingClientRect()

        return {
            x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
            y: rect ? rect.top + Math.min(rect.height / 2, 16) : window.innerHeight / 2
        }
    }
    const origin = getOrigin()

    if (alarmStripTimer) {
        clearTimeout(alarmStripTimer)
    }

    alarmStripTimer = setTimeout(() => {
        showAlarmStrip.value = false
    }, 1800)

    emit(
        "alarm",
        {
            application: props.application.name,
            origin,
            getOrigin
        }
    )

}

function onNormal(){

    emit(
        "normal",
        props.application.name
    )

}

onMounted(() => {
    if (!hasDemo.value) return

    queueDemoMount()

    if (!("IntersectionObserver" in window)) {
        return
    }

    mountObserver = new IntersectionObserver(
        (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                queueDemoMount()
            }
        },
        {
            rootMargin: "420px 120px",
            threshold: 0.01
        }
    )

    if (cardEl.value) {
        mountObserver.observe(cardEl.value)
    }
})

onBeforeUnmount(() => {
    if (alarmStripTimer) {
        clearTimeout(alarmStripTimer)
    }
    if (mountTimer) {
        clearTimeout(mountTimer)
    }
    if (mountRaf) {
        cancelAnimationFrame(mountRaf)
    }
    mountObserver?.disconnect()
})
</script>
<style scoped>

.card{
    width:360px;
    height:min(55vh, 560px);
    display:flex;
    flex-direction:column;
    overflow:hidden;
    border-radius:var(--ax-card-radius);
    background:var(--ax-color-bg-card-light);
    color:var(--color-primary);
    box-shadow:0 24px 44px rgba(0, 0, 0, .34), 0 2px 12px rgba(3, 10, 18, .55);
}

.card *{
    color:inherit;
}

.card-header{
    position:relative;

    display:flex;
    align-items:center;
    gap:18px;

    padding:10px 18px;
}

.alarm-strip{
    position:absolute;
    left:0;
    right:0;
    top:0;
    z-index:50;
    margin:0;
    padding:8px 12px;
    border:0;
    border-bottom:1px solid #f1aeb5;
    border-radius:0;
    background:#f8d7da;
    color:#842029;
    font-size:.78rem;
    font-weight:700;
    line-height:1.2;
    letter-spacing:.02em;
    text-transform:uppercase;
    text-align:center;
}

.card-header::after{
    content:"";

    position:absolute;

    left:0;
    bottom:0;

    width:100%;
    height:4px;

    background:linear-gradient(
        90deg,
        var(--color-secondary),
        #ff6b5b,
        var(--color-secondary)
    );

    box-shadow:0 2px 6px rgba(197,35,23,.4);
}

.logo{
    width:46px;
    height:46px;
    border-radius:12px;
    background:rgba(255,255,255,.24);
    display:flex;
    justify-content:center;
    align-items:center;
    flex-shrink:0;
    overflow:hidden;
}

.logo img{
    width:100%;
    height:100%;
    object-fit:contain;
}

.header-info{
    display:flex;
    flex-direction:column;
    justify-content:center;
}

.badge{
    text-transform:uppercase;
    letter-spacing:.18rem;
    font-size:.68rem;
    opacity:.7;
}

h2{
    margin:0;
    font-size:1.12rem;
    font-weight:300;
}

.header-info p {
    font-size: 0.82rem;
}

.card-description{
    padding:18px 24px;
    min-height:92px;
}

.card-description p{
    margin:0;
    font-size:.9rem;
    line-height:1.7;
    opacity:.75;
}

.card-game{
    position:relative;
    flex:1;
    overflow:hidden;
}

.card-game > *:not(.alarm-strip){
    width:100%;
    height:100%;
}

.loading,
.no-demo{
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    gap:16px;
    text-align:center;
    opacity:.7;
}

.icon{
    font-size:2rem;
}

.card-footer{
    padding:12px 14px;
    border-top:1px solid rgba(8, 18, 32, .08);
    background:rgba(255,255,255,.42);
}

.card-footer p{
    margin:0;
    font-size:.8rem;
    line-height:1.5;
    opacity:.8;
}

.instruction-text {
    font-size: 0.9rem;
}

.instruction-mobile {
    display: none;
}

@media (max-width: 900px) {
    .card {
        width: 320px;
        height: min(54vh, 500px);
        border-radius: var(--ax-card-radius);
    }

    .card-header {
        gap: 12px;
        padding: 8px 14px;
    }

    .logo {
        width: 40px;
        height: 40px;
    }

    h2 {
        font-size: 1rem;
    }

    .header-info p {
        font-size: 0.74rem;
    }

    .instruction-desktop {
        display: none;
    }

    .instruction-mobile {
        display: block;
        color: var(--color-primary);
        font-size: 0.88rem;
        font-weight: 650;
        line-height: 1.35;
        opacity: 1;
    }
}

@media (max-width: 640px) {
    .card {
        width: 84vw;
        height: 56vh;
    }

    .alarm-strip {
        font-size: 0.68rem;
    }

    .card-footer {
        padding: 12px 14px;
        border-top-color: rgba(197, 35, 23, 0.2);
        background: rgba(255, 255, 255, 0.88);
    }
}

</style>