<template>
<section ref="angelEl" class="angel">
    <Teleport to="body">
        <span
            v-if="flyingDot"
            ref="flyingDotEl"
            class="flying-alarm-dot"
            :class="{ 'is-waiting': !flyingDot.isFlying }"
            :style="{
                left: `${flyingDot.x}px`,
                top: `${flyingDot.y}px`,
                color: flyingDot.color
            }"
            aria-hidden="true"
        ></span>
    </Teleport>

    <div class="window">
        <div class="window-header">
            <div class="window-title">
                <img
    :src="resolveImage('/immagini/Angel.png')"
    alt=""
    width="38"
    height="38"
/>
                <span>Angel BPM</span>
            </div>

            <div class="window-buttons">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>

        <div class="window-body">
            <aside class="timeline">
                <div class="timeline-title-row">
                    <div class="timeline-title">
                        Cronologia
                    </div>

                    <button class="reset-btn" @click="resetAlarms">
                        Reset
                    </button>
                </div>

                <div class="timeline-content">
                    <div class="timeline-list">
                        <button
                            v-for="a in alarms"
                            :key="a.id"
                            :data-alarm-id="a.id"
                            type="button"
                            class="alarm-card"
                            :class="{
                                'new-alarm': a.id === latestAlarmId,
                                'alarm-landed': a.id === landingAlarmId
                            }"
                            @click="showProcedure(a)"
                        >
                            <span
                                v-if="landedAlarmIds.has(a.id)"
                                class="dot"
                                :style="{ background: colorFor(a.name) }"
                            ></span>

                            <div class="alarm-info">
                                <div class="alarm-top">
                                    <span class="alarm-name">
                                        {{ a.name }}
                                    </span>

                                    <span class="alarm-value">
                                        {{ a.value }}{{ a.unit }}
                                    </span>
                                </div>

                                <div class="alarm-time">
                                    {{ formatTime(a.timestamp) }}
                                </div>
                            </div>
                        </button>
                    </div>

                    <Transition name="procedure-panel">
                        <aside v-if="activeProcedure" class="procedure-sidebar procedure-sidebar-mobile">
                            <div class="procedure-header">
                                <div class="procedure-heading">
                                    <h3 class="text-uppercase">Procedura</h3>
                                    <p>{{ activeProcedure.name }}</p>
                                </div>

                                <button
                                    class="procedure-close"
                                    type="button"
                                    aria-label="Chiudi procedure"
                                    title="Chiudi"
                                    @click="activeProcedure = null"
                                >
                                    Chiudi
                                </button>
                            </div>

                            <ol class="procedure-list">
                                <li v-for="step in activeProcedure.steps" :key="step">
                                    <span class="procedure-step-icon" aria-hidden="true"></span>
                                    <span>{{ step }}</span>
                                </li>
                            </ol>
                        </aside>
                    </Transition>
                </div>
            </aside>

            <main class="graph">
                <Transition name="procedure-panel">
                    <aside v-if="activeProcedure" class="procedure-sidebar procedure-sidebar-desktop">
                        <div class="procedure-header">
                            <div class="procedure-heading">
                                <h3 class="text-uppercase">Procedura</h3>
                                <p>{{ activeProcedure.name }}</p>
                            </div>

                            <button
                                class="procedure-close"
                                type="button"
                                aria-label="Chiudi procedure"
                                title="Chiudi"
                                @click="activeProcedure = null"
                            >
                                Chiudi
                            </button>
                        </div>

                        <ol class="procedure-list">
                            <li v-for="step in activeProcedure.steps" :key="step">
                                <span class="procedure-step-icon" aria-hidden="true"></span>
                                <span>{{ step }}</span>
                            </li>
                        </ol>
                    </aside>
                </Transition>

                <div class="empty" v-if="alarms.length === 0">
                    <h2 class="empty-title">
                        Nessun evento rilevato
                    </h2>

                    <p class="empty-subtitle">
                        Interagisci con una delle demo per vedere gli allarmi in tempo reale
                    </p>
                </div>

                <div class="chart" ref="chartEl" v-if="alarms.length > 0"></div>

                <div class="pie-panel" v-if="alarms.length > 0">
                    <div class="pie-title">Tipi di allarme</div>

                    <div class="pie" ref="pieEl"></div>

                    <div class="pie-legend">
                        <div
                            v-for="item in pieBreakdown"
                            :key="item.name"
                            class="pie-legend-item"
                        >
                            <span
                                class="dot"
                                :style="{ background: colorFor(item.name) }"
                            ></span>

                            <span class="pie-legend-name">{{ item.name }}</span>

                            <span class="pie-legend-percent">{{ item.percent }}%</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue"
import alarmProcedures from "~/data/alarmProcedures.json"
type ECharts = import("echarts").ECharts
type EChartsModule = typeof import("echarts")

type Alarm = {
    id: string
    name: string
    unit: string
    timestamp: string
    value: number
}

type AlarmEvent = {
    application: string
    origin: { x: number; y: number }
    getOrigin: () => { x: number; y: number }
}

type Procedure = {
    name: string
    steps: string[]
}

const props = defineProps<{
    alarmEvent?: AlarmEvent | null
}>()

const alarms = ref<Alarm[]>([])
const latestAlarmId = ref<string | null>(null)
const landedAlarmIds = ref(new Set<string>())
const landingAlarmId = ref<string | null>(null)
const angelEl = ref<HTMLElement | null>(null)
const chartEl = ref<HTMLElement | null>(null)
const pieEl = ref<HTMLElement | null>(null)
const flyingDotEl = ref<HTMLElement | null>(null)
const flyingDot = ref<{ x: number; y: number; color: string; isFlying: boolean } | null>(null)
const activeProcedure = ref<Procedure | null>(null)

let chart: ECharts | null = null
let pieChart: ECharts | null = null
let echartsModule: EChartsModule | null = null
let latestAlarmTimer: ReturnType<typeof setTimeout> | null = null
let flightAnimation: Animation | null = null
let flightSequence = 0
let waitingAnchorRaf = 0
let isProcessingAlarmQueue = false
const alarmQueue: AlarmEvent[] = []
const processedAlarmIds = new Set<string>()

const colors: Record<string, string> = {
    "Crepa aperta": "#6f7682",
    Traffico: "#b84cff",
    Esondazione: "#2f9df4",
    Frana: "#d94841",
    "Lavori in corso": "#ff8a1e"
}

const alarmNameByApplication: Record<string, string> = {
    "Geo Angel": "Frana",
    "Traffic Alert": "Traffico",
    "Angel River": "Esondazione",
    "Angel Road Site": "Lavori in corso",
    "Angel Bridge": "Crepa aperta"
}

function colorFor(name: string) {
    return colors[name] ?? "#6b7280"
}

function formatTime(ts: string) {
    const d = new Date(ts)

    return d.toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    })
}

function buildOption() {
    const byName: Record<string, Alarm[]> = {}

    for (const a of alarms.value) {
        (byName[a.name] ??= []).push(a)
    }

    const series = Object.entries(byName).map(([name, items]) => ({
        name,
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 7,
        color: colorFor(name),
        lineStyle: {
            width: 3
        },
        data: items
            .slice()
            .reverse()
            .map((a) => [a.timestamp, a.value])
    }))

    return {
        backgroundColor: "transparent",

        grid: {
            left: 55,
            right: 25,
            top: 45,
            bottom: 40
        },

        legend: {
            top: 5,
            textStyle: {
                color: "#6b7280",
                fontSize: 12
            }
        },

        tooltip: {
            trigger: "axis",
            backgroundColor: "#ffffff",
            borderColor: "#d5d5d5",
            borderWidth: 1,
            textStyle: {
                color: "#374151"
            },
            formatter: (params: any) => {
                return params
                    .map((p: any) => {
                        const alarm = alarms.value.find(
                            (a) =>
                                a.timestamp === p.data[0] &&
                                a.name === p.seriesName
                        )

                        return `${p.seriesName}: ${p.data[1]}${alarm?.unit ?? ""}`
                    })
                    .join("<br>")
            }
        },

        xAxis: {
            type: "time",
            axisLine: {
                lineStyle: {
                    color: "#cfd4dc"
                }
            },
            axisTick: {
                lineStyle: {
                    color: "#cfd4dc"
                }
            },
            axisLabel: {
                color: "#6b7280"
            },
            splitLine: {
                show: false
            }
        },

        yAxis: {
            type: "value",
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: "#6b7280"
            },
            splitLine: {
                lineStyle: {
                    color: "#ececec"
                }
            }
        },

        series
    }
}

const pieBreakdown = computed(() => {
    const counts: Record<string, number> = {}

    for (const a of alarms.value) {
        counts[a.name] = (counts[a.name] ?? 0) + 1
    }

    const total = alarms.value.length

    return Object.entries(counts).map(([name, count]) => ({
        name,
        percent: Math.round((count / total) * 100)
    }))
})

function buildPieOption() {
    const counts: Record<string, number> = {}

    for (const a of alarms.value) {
        counts[a.name] = (counts[a.name] ?? 0) + 1
    }

    const data = Object.entries(counts).map(([name, value]) => ({
        name,
        value,
        itemStyle: {
            color: colorFor(name)
        }
    }))

    return {
        backgroundColor: "transparent",

        tooltip: {
            trigger: "item",
            backgroundColor: "#ffffff",
            borderColor: "#d5d5d5",
            borderWidth: 1,
            textStyle: {
                color: "#374151"
            },
            formatter: "{b}: {d}%"
        },

        series: [{
            type: "pie",
            radius: ["48%", "72%"],
            avoidLabelOverlap: false,
            label: {
                show: false
            },
            labelLine: {
                show: false
            },
            itemStyle: {
                borderColor: "#f3f4f6",
                borderWidth: 3
            },
            emphasis: {
                scale: true,
                scaleSize: 6
            },
            data
        }]
    }
}

async function loadECharts(): Promise<EChartsModule> {
    if (!echartsModule) {
        echartsModule = await import("echarts")
    }

    return echartsModule
}

async function renderChart() {
    if (!chartEl.value) return

    const echarts = await loadECharts()

    if (!chart) {
        chart = echarts.init(chartEl.value)
    }

    chart.setOption(buildOption())
}

async function renderPie() {
    if (!pieEl.value) return

    const echarts = await loadECharts()

    if (!pieChart) {
        pieChart = echarts.init(pieEl.value)
    }

    pieChart.setOption(buildPieOption())
}

async function refresh() {
    const previousTopId = alarms.value[0]?.id ?? null

    alarms.value = JSON.parse(
        localStorage.getItem("alarms") ?? "[]"
    )

    const currentTopId = alarms.value[0]?.id ?? null
    if (currentTopId && currentTopId !== previousTopId) {
        latestAlarmId.value = currentTopId

        if (latestAlarmTimer) {
            clearTimeout(latestAlarmTimer)
        }

        latestAlarmTimer = setTimeout(() => {
            latestAlarmId.value = null
        }, 2600)
    }

    await nextTick()

    if (alarms.value.length > 0) {
        await Promise.all([renderChart(), renderPie()])
    }

    return currentTopId
}

async function waitForNewAlarm(expectedName: string, sequence: number) {
    const timeoutAt = performance.now() + 10000

    while (sequence === flightSequence && performance.now() < timeoutAt) {
        const storedAlarms: Alarm[] = JSON.parse(localStorage.getItem("alarms") ?? "[]")
        const newAlarm = storedAlarms.find((alarm) => (
            alarm.name === expectedName && !processedAlarmIds.has(alarm.id)
        ))

        if (newAlarm) {
            processedAlarmIds.add(newAlarm.id)
            return newAlarm.id
        }

        await new Promise((resolve) => window.setTimeout(resolve, 80))
    }

    return null
}

function followWaitingCard(event: AlarmEvent, sequence: number) {
    const updatePosition = () => {
        if (sequence !== flightSequence || !flyingDot.value || flyingDot.value.isFlying) {
            waitingAnchorRaf = 0
            return
        }

        const origin = event.getOrigin()
        flyingDot.value = {
            ...flyingDot.value,
            ...origin
        }
        waitingAnchorRaf = requestAnimationFrame(updatePosition)
    }

    if (waitingAnchorRaf) {
        cancelAnimationFrame(waitingAnchorRaf)
    }
    waitingAnchorRaf = requestAnimationFrame(updatePosition)
}

function stopFollowingCard() {
    if (waitingAnchorRaf) {
        cancelAnimationFrame(waitingAnchorRaf)
        waitingAnchorRaf = 0
    }
}

async function animateAlarm(event: AlarmEvent) {
    const sequence = flightSequence
    activeProcedure.value = null
    landingAlarmId.value = null

    const expectedName = alarmNameByApplication[event.application]

    flyingDot.value = {
        ...event.origin,
        color: colorFor(expectedName),
        isFlying: false
    }
    followWaitingCard(event, sequence)

    const newAlarmId = await waitForNewAlarm(expectedName, sequence)
    if (!newAlarmId || sequence !== flightSequence) {
        stopFollowingCard()
        flyingDot.value = null
        return
    }

    await refresh()
    latestAlarmId.value = newAlarmId
    await nextTick()

    if (sequence !== flightSequence) return

    const target = angelEl.value?.querySelector<HTMLElement>(`[data-alarm-id="${newAlarmId}"]`)
    if (!target) return

    const targetRect = target.getBoundingClientRect()
    const targetX = targetRect.left + Math.min(24, targetRect.width / 2)
    const targetY = targetRect.top + targetRect.height / 2
    const alarm = alarms.value.find((item) => item.id === newAlarmId)
    if (!alarm) return

    const departureOrigin = event.getOrigin()
    stopFollowingCard()

    flyingDot.value = {
        ...departureOrigin,
        color: colorFor(alarm.name),
        isFlying: true
    }

    await nextTick()
    if (!flyingDotEl.value || sequence !== flightSequence) return

    flightAnimation?.cancel()

    const deltaX = targetX - departureOrigin.x
    const deltaY = targetY - departureOrigin.y
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const duration = reducedMotion ? 1 : 1450
    const arcHeight = Math.max(130, Math.min(240, Math.abs(deltaY) * 0.34))

    flightAnimation = flyingDotEl.value.animate([
        { transform: "translate(-50%, -50%) scale3d(1, 1, 1)", opacity: 1 },
        { transform: "translate(-50%, calc(-50% + 12px)) scale3d(1.18, .72, 1)", opacity: 1, offset: 0.1 },
        { transform: `translate3d(calc(-50% + ${deltaX * 0.5}px), calc(-50% + ${deltaY * 0.42 - arcHeight}px), 0) scale3d(1.2, 1.2, 1)`, opacity: 1, offset: 0.5 },
        { transform: `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) scale3d(1.2, .72, 1)`, opacity: 1, offset: 0.79 },
        { transform: `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY - 28}px), 0) scale3d(.88, 1.08, 1)`, opacity: 1, offset: 0.9 },
        { transform: `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) scale3d(.72, .72, 1)`, opacity: 1 }
    ], {
        duration,
        easing: "cubic-bezier(.2, .72, .18, 1)",
        fill: "forwards"
    })

    try {
        await flightAnimation.finished
    } catch {
        return
    }

    if (sequence !== flightSequence) return

    flyingDot.value = null
    landedAlarmIds.value = new Set([...landedAlarmIds.value, alarm.id])
    landingAlarmId.value = alarm.id
    activeProcedure.value = {
        name: alarm.name,
        steps: alarmProcedures[alarm.name as keyof typeof alarmProcedures] ?? []
    }

    window.setTimeout(() => {
        if (landingAlarmId.value === alarm.id) {
            landingAlarmId.value = null
        }
    }, 700)
}

async function processAlarmQueue() {
    if (isProcessingAlarmQueue) return

    isProcessingAlarmQueue = true

    while (alarmQueue.length > 0) {
        const event = alarmQueue.shift()
        if (event) {
            await animateAlarm(event)
        }
    }

    isProcessingAlarmQueue = false
}

function showProcedure(alarm: Alarm) {
    activeProcedure.value = {
        name: alarm.name,
        steps: alarmProcedures[alarm.name as keyof typeof alarmProcedures] ?? []
    }
}

function resetAlarms() {
    flightSequence++
    alarmQueue.length = 0
    stopFollowingCard()
    flightAnimation?.cancel()
    flyingDot.value = null
    localStorage.removeItem("alarms")

    alarms.value = []
    landedAlarmIds.value = new Set()
    landingAlarmId.value = null
    processedAlarmIds.clear()

    chart?.dispose()
    chart = null

    pieChart?.dispose()
    pieChart = null
}

function onResize() {
    chart?.resize()
    pieChart?.resize()
}

watch(() => props.alarmEvent, (event) => {
    if (event) {
        alarmQueue.push(event)
        processAlarmQueue()
    }
})

onMounted(async () => {
    await refresh()
    landedAlarmIds.value = new Set(alarms.value.map((alarm) => alarm.id))
    alarms.value.forEach((alarm) => processedAlarmIds.add(alarm.id))
    window.addEventListener("resize", onResize)
})

onUnmounted(() => {
    flightSequence++
    stopFollowingCard()
    window.removeEventListener("resize", onResize)

    chart?.dispose()
    chart = null

    pieChart?.dispose()
    pieChart = null

    if (latestAlarmTimer) {
        clearTimeout(latestAlarmTimer)
    }

    flightAnimation?.cancel()
})

defineExpose({ refresh })
</script>

<style scoped>
.angel {
    height: 40vh;
    padding: 40px 8vw 0;
    display: flex;
    align-items: center;
}

.window {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: #eef2f7;
    color: var(--color-primary);
    box-shadow: 0 28px 48px rgba(0, 0, 0, 0.38), 0 4px 14px rgba(3, 10, 18, 0.48);
}

.window * {
    color: inherit;
}

.window-header {
    position: relative;
    height: 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px;
}

.window-header::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--color-secondary), #ff6b5b, var(--color-secondary));
    box-shadow: 0 2px 6px rgba(197, 35, 23, 0.4);
}

.window-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.95rem;
    font-weight: 600;
}

.window-title img {
    width: 38px;
    height: 38px;
    object-fit: contain;
}

.window-buttons {
    display: flex;
    gap: 10px;
}

.window-buttons span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #cfd5de;
}

.window-body {
    display: flex;
    height: calc(100% - 56px);
}

.timeline {
    width: 30%;
    padding: 22px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.timeline-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
}

.timeline-title {
    text-transform: uppercase;
    letter-spacing: 0.12rem;
    font-size: 0.82rem;
    opacity: 0.65;
}

.reset-btn {
    border: none;
    background: #d7dde6;
    padding: 8px 18px;
    border-radius: 999px;
    cursor: pointer;
}

.timeline-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.timeline-content {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.alarm-card {
    width: 100%;
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--ax-card-radius);
    border: 1px solid rgba(7, 17, 29, 0.09);
    background: rgba(255, 255, 255, 0.46);
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease;
}

.alarm-card:hover,
.alarm-card:focus-visible {
    border-color: rgba(197, 35, 23, 0.42);
    background: rgba(255, 255, 255, 0.72);
    outline: none;
}

.alarm-card.new-alarm {
    border-color: #ff4d4f;
    box-shadow: 0 0 0 1px rgba(255, 77, 79, 0.55), 0 0 16px rgba(255, 77, 79, 0.35);
    animation: newAlarmPulse 0.95s ease-in-out infinite;
}

.alarm-card.alarm-landed {
    animation: alarmLanding 0.65s cubic-bezier(.2, .8, .25, 1);
    transform-origin: 24px 50%;
}

.dot {
    width: 10px;
    height: 10px;
    flex: 0 0 10px;
    border-radius: 50%;
    margin-top: 5px;
    animation: dotMaterialize 0.5s cubic-bezier(.2, .9, .25, 1.25);
}

.alarm-info {
    flex: 1;
}

.alarm-top {
    display: flex;
    justify-content: space-between;
}

.alarm-time {
    margin-top: 4px;
    font-size: 0.72rem;
    opacity: 0.6;
}

.graph {
    position: relative;
    flex: 1;
    display: flex;
    gap: 28px;
    padding: 24px;
}

.flying-alarm-dot {
    position: fixed;
    z-index: 10000;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background:
        radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.98) 0 7%, rgba(255, 255, 255, 0.45) 8%, transparent 25%),
        radial-gradient(circle at 38% 34%, color-mix(in srgb, currentColor 68%, white) 0 14%, currentColor 48%, color-mix(in srgb, currentColor 72%, black) 100%);
    box-shadow:
        inset -7px -9px 11px rgba(0, 0, 0, 0.3),
        inset 5px 5px 8px rgba(255, 255, 255, 0.34),
        0 0 0 7px color-mix(in srgb, currentColor 20%, transparent),
        0 16px 28px rgba(7, 17, 29, 0.44);
    filter: saturate(1.18);
    transform: translate(-50%, -50%);
    will-change: transform;
    pointer-events: none;
}

.flying-alarm-dot.is-waiting {
    animation: ballReady 0.72s ease-in-out infinite alternate;
}

.procedure-sidebar {
    position: absolute;
    z-index: 20;
    top: 0;
    right: 0;
    width: min(320px, 88%);
    height: 100%;
    padding: 20px 18px;
    border-left: 1px solid rgba(197, 35, 23, 0.18);
    background: rgb(255, 240, 220);
    box-shadow: -18px 0 36px rgba(7, 17, 29, 0.16);
    overflow-y: auto;
}

.procedure-sidebar-mobile {
    display: none;
}

.procedure-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.procedure-heading h3 {
    margin: 0;
    color: #141e27;
    font-size: 1.15rem;
    font-weight: 700;
}

.procedure-heading p {
    margin: 3px 0 0;
    color: #5d6570;
    font-size: 0.82rem;
}

.procedure-close {
    min-height: 36px;
    padding: 0 13px;
    border: 1px solid #1f1f1f;
    background: transparent;
    color: #1f1f1f;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    cursor: pointer;
}

.procedure-list {
    margin: 22px 0 0;
    padding: 0;
    display: grid;
    gap: 6px;
    list-style: none;
    counter-reset: procedure-step;
}

.procedure-list li {
    min-height: 44px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(197, 35, 23, 0.12);
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.82);
    color: #141e27;
    font-size: 0.8rem;
    line-height: 1.35;
    counter-increment: procedure-step;
    transition: background 0.18s ease;
}

.procedure-list li:hover {
    background: rgb(255, 220, 200);
}

.procedure-step-icon {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: rgba(197, 35, 23, 0.12);
    color: #c52317;
    font-weight: 800;
}

.procedure-step-icon::after {
    content: counter(procedure-step);
}

.procedure-panel-enter-active,
.procedure-panel-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.procedure-panel-enter-from,
.procedure-panel-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

.chart {
    flex: 1;
    min-width: 0;
    height: 100%;
}

.pie-panel {
    width: 220px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-left: 1px solid rgba(0, 0, 0, 0.05);
    padding-left: 24px;
}

.pie {
    width: 100%;
    height: 180px;
}

.pie-title {
    margin-bottom: 12px;
    font-size: 0.8rem;
    opacity: 0.65;
}

.pie-legend {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.pie-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.pie-legend-name {
    flex: 1;
}

.pie-legend-percent {
    font-weight: 700;
}

.empty {
    margin: auto;
    text-align: center;
}

.empty-title {
    font-size: 1.7rem;
}

.empty-subtitle {
    margin-top: 8px;
    font-size: 1.05rem;
    opacity: 0.7;
}

@keyframes newAlarmPulse {
    0%,
    100% {
        box-shadow: 0 0 0 1px rgba(255, 77, 79, 0.45), 0 0 12px rgba(255, 77, 79, 0.3);
    }

    50% {
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.85), 0 0 22px rgba(255, 77, 79, 0.55);
    }
}

@keyframes ballReady {
    from {
        transform: translate(-50%, -50%) scale(0.88);
    }

    to {
        transform: translate(-50%, calc(-50% - 10px)) scale(1.08);
    }
}

@keyframes alarmLanding {
    0%, 100% { transform: translateY(0); }
    32% { transform: translateY(7px) scaleY(0.96); }
    62% { transform: translateY(-8px); }
    82% { transform: translateY(3px); }
}

@keyframes dotMaterialize {
    0% {
        opacity: 0;
        transform: scale(0);
    }

    58% {
        opacity: 1;
        transform: scale(1.65);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@media (max-width: 900px) {
    .angel {
        min-height: auto;
        padding: 14px 5vw 0;
    }

    .window {
        border-radius: 20px;
    }

    .window-body {
        flex-direction: column;
        height: auto;
        min-height: 62vh;
    }

    .timeline {
        width: 100%;
        border-right: 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        max-height: 28vh;
    }

    .timeline-list {
        min-height: 14vh;
    }

    .procedure-sidebar-desktop {
        display: none;
    }

    .procedure-sidebar-mobile {
        display: block;
        inset: 0;
        width: 100%;
        height: 100%;
        border-left: 0;
        box-shadow: none;
    }

    .graph {
        width: 100%;
        min-height: 32vh;
        flex-direction: column;
    }

    .chart {
        height: 240px;
    }

    .pie-panel {
        width: 100%;
        border-left: 0;
        border-top: 1px solid rgba(0, 0, 0, 0.06);
        padding: 12px 0 0;
    }

    .pie {
        max-width: 280px;
        margin: 0 auto;
    }
}

@media (max-width: 640px) {
    .window-title {
        font-size: 0.82rem;
    }

    .timeline-title {
        font-size: 0.72rem;
    }

    .reset-btn {
        padding: 6px 12px;
        font-size: 0.74rem;
    }

    .alarm-card {
        padding: 10px 12px;
        gap: 10px;
    }

    .alarm-name,
    .alarm-value {
        font-size: 0.8rem;
    }

    .chart {
        height: 200px;
    }

    .empty-title {
        font-size: 1.1rem;
    }

    .empty-subtitle {
        font-size: 0.9rem;
    }
}
</style>
