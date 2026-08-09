<template>
<div
    class="geo-card"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
>

    <div class="sensor" :class="{ alarm: isAlarm }">
        <div class="core">
            <div class="led"></div>
        </div>
        <span class="label">
            {{ isAlarm ? currentValue.toFixed(1) + ' G' : 'Sensore urti' }}
        </span>
    </div>

    <div class="measure">
        <div class="measure-value">Impatto massimo {{ currentValue.toFixed(1) }} G</div>
        <div class="measure-tip">Attraversa il target centrale ad alta velocita</div>
    </div>

</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const emit = defineEmits<{
    (e: "alarm"): void
    (e: "normal"): void
}>()

const HIT_RADIUS = 65
const SPEED_TO_G = 4
const MAX_G = 5
const ALARM_DISPLAY_MS = 1200

const isAlarm = ref(false)
const currentValue = ref(0)

let alarmTimer: ReturnType<typeof setTimeout> | null = null
let initialized = false
let lastX = 0
let lastY = 0
let lastT = 0
let wasInside = false
let peakSpeed = 0

function saveAlarm(value: number) {

    const alarms = JSON.parse(
        localStorage.getItem("alarms") ?? "[]"
    )

    alarms.unshift({

        id: crypto.randomUUID(),

        name: "Frana",

        unit: "G",

        timestamp: new Date().toISOString(),

        value: Number(value.toFixed(1))

    })

    localStorage.setItem(
        "alarms",
        JSON.stringify(alarms.slice(0, 100))
    )

}

function triggerAlarm(speed: number) {

    if (speed <= 0 || isAlarm.value) return

    const raw = speed * SPEED_TO_G

    const value = MAX_G * (1 - Math.exp(-raw / MAX_G))

    currentValue.value = value

    isAlarm.value = true

    emit("alarm")

    if (alarmTimer) clearTimeout(alarmTimer)

    alarmTimer = setTimeout(() => {

        saveAlarm(currentValue.value)

        isAlarm.value = false

        emit("normal")

    }, ALARM_DISPLAY_MS)

}

function onMouseMove(e: MouseEvent) {

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()

    const cx = rect.width / 2
    const cy = rect.height / 2

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const now = performance.now()

    if (initialized) {

        const dt = now - lastT

        if (dt > 0) {

            const d = Math.hypot(x - lastX, y - lastY)
            const speed = d / dt

            const inside = Math.hypot(x - cx, y - cy) <= HIT_RADIUS

            if (inside) {
                peakSpeed = Math.max(peakSpeed, speed)
            }

            if (wasInside && !inside) {
                triggerAlarm(peakSpeed)
                peakSpeed = 0
            }

            wasInside = inside

        }

    } else {
        initialized = true
    }

    lastX = x
    lastY = y
    lastT = now

}

function onMouseLeave() {

    if (wasInside) {
        triggerAlarm(peakSpeed)
    }

    peakSpeed = 0
    wasInside = false
    initialized = false

}
</script>

<style scoped>

.geo-card {
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
    user-select: none;
    cursor: crosshair;
    --panel-ink: #17304f;
    --panel-muted: #5d7592;
    --panel-line: rgba(37, 70, 116, .2);
    --panel-accent: #4db6ff;
    --panel-danger: #d93b47;
}

.geo-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        radial-gradient(circle at 14% 12%, rgba(255, 255, 255, .86), transparent 44%),
        radial-gradient(circle at 86% 82%, rgba(195, 221, 255, .5), transparent 48%);
}

.geo-card::after {
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

.sensor {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    z-index: 30;
}

.sensor::before,
.sensor::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
}

.sensor::before {
    width: 132px;
    height: 132px;
    border: 2px dashed rgba(143, 188, 241, .42);
}

.sensor::after {
    width: 190px;
    height: 190px;
    border: 1px solid rgba(108, 154, 213, .24);
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

.measure {
    position: absolute;
    left: 50%;
    bottom: 14px;
    transform: translateX(-50%);
    width: 84%;
    padding: 10px 12px 9px;
    border-radius: 0;
    border: 1px solid var(--panel-line);
    background: rgba(255, 255, 255, .9);
    display: flex;
    flex-direction: column;
    gap: 4px;
    z-index: 30;
}

.measure-value {
    color: var(--panel-ink);
    text-align: center;
    font-size: .78rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
}

.measure-tip {
    color: var(--panel-muted);
    text-align: center;
    font-size: .64rem;
    font-weight: 700;
    letter-spacing: .03em;
    text-transform: uppercase;
}

</style>