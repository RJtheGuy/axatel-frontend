<template>
<div
    ref="card"
    class="river-card"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
>

    <div class="rain" :class="{ active: isRaining }"></div>

    <div
        v-for="m in ticks"
        :key="m"
        class="tick"
        :style="{ bottom: (m / MAX_METERS * 100) + '%' }"
    >
        <span class="color-primary">{{ m }}m</span>
    </div>

    <div class="sensor" :class="{ alarm: isAlarm }">
        <div class="core">
            <div class="led"></div>
        </div>
        <span class="label">
            {{ isAlarm ? levelMeters.toFixed(1) + ' m' : 'Livello fiume' }}
        </span>
    </div>

    <div class="threshold" :style="{ bottom: threshold + '%' }">
        <span>Soglia {{ thresholdMeters.toFixed(1) }}m</span>
    </div>

    <div class="water" :style="{ height: waterLevel + '%' }">
        <div class="wave"></div>
    </div>

</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { gsap } from "gsap"

const emit = defineEmits<{
    (e: "alarm"): void
    (e: "normal"): void
}>()

const card = ref<HTMLElement | null>(null)

const threshold = 42
const RAIN_RATE = 22
const DRAIN_RATE = 9
const MAX_METERS = 5

const ticks = [1, 2, 3, 4, 5]

const waterLevel = ref(0)
const isAlarm = ref(false)
const isRaining = ref(false)
const maxLevel = ref(0)

const levelMeters = computed(() => waterLevel.value / 100 * MAX_METERS)
const thresholdMeters = computed(() => threshold / 100 * MAX_METERS)

function saveAlarm() {

    const alarms = JSON.parse(
        localStorage.getItem("alarms") ?? "[]"
    )

    alarms.unshift({

        id: crypto.randomUUID(),

        name: "Esondazione",

        unit: "m",

        timestamp: new Date().toISOString(),

        value: Number((maxLevel.value / 100 * MAX_METERS).toFixed(1))

    })

    localStorage.setItem(
        "alarms",
        JSON.stringify(alarms.slice(0, 100))
    )

}

function updateWater(delta: number) {

    const rate = isRaining.value ? RAIN_RATE : -DRAIN_RATE

    waterLevel.value = Math.max(
        0,
        Math.min(100, waterLevel.value + rate * delta)
    )

    if (!isAlarm.value && waterLevel.value >= threshold) {

        isAlarm.value = true

        maxLevel.value = waterLevel.value

        emit("alarm")

    }

    if (isAlarm.value) {

        maxLevel.value = Math.max(
            maxLevel.value,
            waterLevel.value
        )

    }

    if (isAlarm.value && waterLevel.value < threshold) {

        saveAlarm()

        isAlarm.value = false

        maxLevel.value = 0

        emit("normal")

    }

}

function tick() {
    updateWater(gsap.ticker.deltaRatio(60) / 60)
}

function onPointerEnter() {
    isRaining.value = true

}

function onPointerLeave() {

    isRaining.value = false

}

onMounted(() => {
    gsap.ticker.add(tick)
})

onUnmounted(() => {

    gsap.ticker.remove(tick)

})
</script>

<style scoped>

.river-card {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--ax-card-radius);
    border: 1px solid rgba(31, 62, 104, .16);
    background: linear-gradient(180deg, #fbfdff 0%, #eef4fb 100%);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, .95),
        0 10px 22px rgba(21, 41, 74, .12);
    --panel-ink: #17304f;
    --panel-muted: #5d7592;
    --panel-line: rgba(37, 70, 116, .2);
    --panel-accent: #4db6ff;
    --panel-danger: #d93b47;
}

.river-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        radial-gradient(circle at 14% 12%, rgba(255, 255, 255, .86), transparent 44%),
        radial-gradient(circle at 86% 82%, rgba(195, 221, 255, .5), transparent 48%);
}

.river-card::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(to right, rgba(62, 98, 145, .06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(62, 98, 145, .06) 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: .35;
}

.rain {
    position: absolute;
    inset: 0;
    z-index: 18;
    opacity: 0;
    pointer-events: none;
    transition: opacity .25s;
    background: repeating-linear-gradient(102deg, rgba(173, 225, 255, .5) 0 2px, transparent 2px 40px);
    background-size: 140px 140%;
    animation: rainfall .3s linear infinite;
}

.rain.active {
    opacity: .55;
}

@keyframes rainfall {
    from { background-position: 0 -20%; }
    to { background-position: 0 100%; }
}

.tick {
    position: absolute;
    left: 10px;
    width: calc(100% - 20px);
    border-top: 1px dashed rgba(157, 198, 241, .24);
    z-index: 7;
}

.tick span {
    position: absolute;
    left: -2px;
    top: -10px;
    color: var(--panel-muted);
    font-size: .67rem;
    font-weight: 700;
    letter-spacing: .03em;
}

.sensor {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    z-index: 30;
}

.sensor .core {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 1px solid var(--panel-line);
    background: rgba(255, 255, 255, .95);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .9);
}

.led {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #53df9f;
    box-shadow: 0 0 12px rgba(83, 223, 159, .75);
    transition: .2s;
}

.sensor.alarm .led {
    background: var(--panel-danger);
    box-shadow: 0 0 16px rgba(255, 79, 95, .9);
}

.label {
    padding: 4px 10px;
    border-radius: 0;
    border: 1px solid var(--panel-line);
    background: rgba(255, 255, 255, .92);
    color: var(--panel-ink);
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    white-space: nowrap;
}

.threshold {
    position: absolute;
    left: 10px;
    width: calc(100% - 20px);
    border-top: 2px dashed rgba(255, 91, 109, .82);
    z-index: 20;
}

.threshold span {
    position: absolute;
    right: 0;
    top: -18px;
    color: #ff93a1;
    font-size: .66rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
}

.water {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    background: linear-gradient(180deg, rgba(93, 204, 255, .75), rgba(59, 145, 255, .72));
    box-shadow: inset 0 10px 20px rgba(255, 255, 255, .16);
    transition: height .05s linear;
}

.wave {
    position: absolute;
    top: -10px;
    left: -100%;
    width: 200%;
    height: 20px;
    background: radial-gradient(circle at 10px 10px, rgba(230, 248, 255, .62) 0 8px, transparent 9px) repeat-x;
    background-size: 40px 20px;
    animation: wave 2s linear infinite;
}

@keyframes wave {
    from { transform: translateX(0); }
    to { transform: translateX(40px); }
}

</style>