<template>
<section class="angel">
    <div class="window">
        <div class="window-header">
            <div class="window-title">
                Angel BPM
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

                <div class="timeline-list">
                    <div
                        v-for="a in alarms"
                        :key="a.id"
                        class="alarm-card"
                        :class="{ 'new-alarm': a.id === latestAlarmId }"
                    >
                        <span
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
                    </div>
                </div>
            </aside>

            <main class="graph">
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
type ECharts = import("echarts").ECharts
type EChartsModule = typeof import("echarts")

type Alarm = {
    id: string
    name: string
    unit: string
    timestamp: string
    value: number
}

const props = defineProps<{
    lastAlarm?: string | null
}>()

const alarms = ref<Alarm[]>([])
const latestAlarmId = ref<string | null>(null)
const chartEl = ref<HTMLElement | null>(null)
const pieEl = ref<HTMLElement | null>(null)

let chart: ECharts | null = null
let pieChart: ECharts | null = null
let echartsModule: EChartsModule | null = null
let latestAlarmTimer: ReturnType<typeof setTimeout> | null = null

const colors: Record<string, string> = {
    "Crepa aperta": "#6f7682",
    Traffico: "#b84cff",
    Esondazione: "#2f9df4",
    Frana: "#d94841",
    "Lavori in corso": "#ff8a1e"
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

function refresh() {
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

    nextTick(async () => {
        if (alarms.value.length > 0) {
            await Promise.all([renderChart(), renderPie()])
        }
    })
}

function resetAlarms() {
    localStorage.removeItem("alarms")

    alarms.value = []

    chart?.dispose()
    chart = null

    pieChart?.dispose()
    pieChart = null
}

function onResize() {
    chart?.resize()
    pieChart?.resize()
}

watch(() => props.lastAlarm, () => {
    refresh()
})

onMounted(() => {
    refresh()
    window.addEventListener("resize", onResize)
})

onUnmounted(() => {
    window.removeEventListener("resize", onResize)

    chart?.dispose()
    chart = null

    pieChart?.dispose()
    pieChart = null

    if (latestAlarmTimer) {
        clearTimeout(latestAlarmTimer)
    }
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
    font-size: 0.95rem;
    font-weight: 600;
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

.alarm-card {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--ax-card-radius);
    border: 1px solid rgba(7, 17, 29, 0.09);
    background: rgba(255, 255, 255, 0.46);
}

.alarm-card.new-alarm {
    border-color: #ff4d4f;
    box-shadow: 0 0 0 1px rgba(255, 77, 79, 0.55), 0 0 16px rgba(255, 77, 79, 0.35);
    animation: newAlarmPulse 0.95s ease-in-out infinite;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 5px;
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
    flex: 1;
    display: flex;
    gap: 28px;
    padding: 24px;
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
