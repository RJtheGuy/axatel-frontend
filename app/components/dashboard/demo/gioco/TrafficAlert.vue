<template>
  <div
    class="traffic-card"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <div class="sensor" :class="{ alarm: isAlarm }">
      <div class="core">
        <div class="led"></div>
      </div>
      <span class="label">
        {{ isAlarm ? avgSpeed.toFixed(1) + ' km/h' : 'Telecamera' }}
      </span>
    </div>

    <div ref="road" class="road">
      <div class="divider"></div>
      <div
        v-for="car in cars"
        :key="car.id"
        class="car"
        :class="{ reverse: car.dir === -1 }"
        :style="{
          left: car.x + '%',
          top: car.y + '%'
        }"
      >
        <div
          class="car-body"
          :style="{ backgroundImage: COLORS[car.colorIndex] }"
        ></div>
        <div class="wheel front"></div>
        <div class="wheel rear"></div>
      </div>
    </div>

    <div class="measure">
      <div class="measure-value">
        Velocità media {{ avgSpeed.toFixed(1) }} km/h
      </div>
      <div class="measure-bar">
        <div
          class="measure-fill"
          :style="{
            width: (avgSpeed / FREE_FLOW_SPEED * 100) + '%'
          }"
        ></div>
        <div
          class="threshold-marker"
          :class="{ active: isAlarm }"
          :style="{
            left: (THRESHOLD_SPEED / FREE_FLOW_SPEED * 100) + '%'
          }"
        ></div>
      </div>
      <div class="measure-scale" style="color: var(--color-primary)">
        <span>0</span>
        <span class="threshold-label">
          {{ THRESHOLD_SPEED }} km/h
        </span>
        <span>{{ FREE_FLOW_SPEED }} km/h</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { gsap } from "gsap"

const emit = defineEmits<{
  (e: "alarm"): void
  (e: "normal"): void
}>()
const road = ref<HTMLElement | null>(null)

const COLORS = [
  "linear-gradient(180deg,#58c7ff,#2588d8)",
  "linear-gradient(180deg,#ff6b6b,#d64040)",
  "linear-gradient(180deg,#ffd45f,#d8a11d)",
  "linear-gradient(180deg,#ffffff,#bfc7d2)"
]

// Parametri della simulazione
const FREE_FLOW_SPEED = 60
const THRESHOLD_SPEED = 20 // Allarme sotto i 20 km/h
const CLEAR_THRESHOLD_SPEED = 25 // Rientro allarme sopra i 25 km/h (Isteresi anti-rimbalzo)
const MIN_SPEED = 5 // Movimento minimo 5 km/h

const SPAWN_INTERVAL_BASE = 1600
const SPAWN_INTERVAL_MIN = 140 // Generazione massiccia quando c'è traffico per riempire la strada

const CAR_LENGTH_PX = 34
const BUFFER_PX = 3 // Spazio fisico minimo ridotto per permettere alle auto di stare vicinissime

const ACCEL_UP = 0.02 // Accelerazione fluida
const ACCEL_DOWN = 0.035 // Frenata morbida e graduale
const SPEED_TO_PCT = 0.0045

const LANE_Y_TOP = 30
const LANE_Y_BOTTOM = 70

const avgSpeed = ref(FREE_FLOW_SPEED)
const isAlarm = ref(false)
const minSpeedReached = ref(FREE_FLOW_SPEED)

const cars = ref<{
  id: number
  lane: "top" | "bottom"
  dir: 1 | -1
  x: number
  y: number
  speed: number
  colorIndex: number
}[]>([])

let nextId = 0
let energy = 0
let generating = false
let spawnAccTop = 0
let spawnAccBottom = 0

let roadWidthPx = 600
let resizeObserver: ResizeObserver | null = null

// Ingombro minimo assoluto in percentuale della strada
function minGapPct(){
  return ((CAR_LENGTH_PX + BUFFER_PX) / roadWidthPx) * 100
}

// Spazio di sicurezza standard (quando non c'è traffico)
function baseSafeGapPct() {
  return (140 / roadWidthPx) * 100
}

// Numero massimo di auto per corsia
function maxCarsPerLane(){
  return Math.max(
    6,
    Math.floor((110 / minGapPct()) * (0.3 + energy * 0.7))
  )
}

function smoothstep(t: number){
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

function saveAlarm(value: number){
  const alarms = JSON.parse(localStorage.getItem("alarms") ?? "[]")
  alarms.unshift({
    id: crypto.randomUUID(),
    name: "Traffico",
    unit: "km/h",
    timestamp: new Date().toISOString(),
    value: Number(value.toFixed(1))
  })
  localStorage.setItem("alarms", JSON.stringify(alarms.slice(0, 100)))
}

function updateAlarmState(){
  // 1. Attivazione allarme (sotto la soglia critica)
  if (!isAlarm.value && avgSpeed.value <= THRESHOLD_SPEED) {
    isAlarm.value = true
    minSpeedReached.value = avgSpeed.value
    emit("alarm")
  }

  // 2. Tracciamento della velocità minima durante l'allarme
  if (isAlarm.value) {
    minSpeedReached.value = Math.min(minSpeedReached.value, avgSpeed.value)
  }

  // 3. Rientro allarme (solo se supera la soglia di isteresi per evitare doppi salvataggi)
  if (isAlarm.value && avgSpeed.value >= CLEAR_THRESHOLD_SPEED) {
    saveAlarm(minSpeedReached.value)
    isAlarm.value = false
    minSpeedReached.value = FREE_FLOW_SPEED
    emit("normal")
  }
}

function trySpawnCar(lane: "top" | "bottom", cap: number){
  const dir: 1 | -1 = lane === "top" ? 1 : -1
  const laneCars = cars.value.filter(c => c.lane === lane)

  if (laneCars.length >= cap) return false

  const gapMin = minGapPct()
  const gapBase = baseSafeGapPct()
  const currentEntryGap = gapBase - (gapBase - (gapMin + 0.5)) * energy

  const spawnX = dir === 1 ? -6 : 106

  let available = 200
  let nearestSpeed = FREE_FLOW_SPEED

  if (laneCars.length) {
    const nearest = dir === 1
      ? laneCars.reduce((m, c) => c.x < m.x ? c : m)
      : laneCars.reduce((m, c) => c.x > m.x ? c : m)

    available = Math.abs(nearest.x - spawnX)
    nearestSpeed = nearest.speed
  }

  if (available < currentEntryGap) return false

  const entrySpeed = Math.min(FREE_FLOW_SPEED, nearestSpeed + 5)

  cars.value.push({
    id: nextId++,
    lane,
    dir,
    x: spawnX,
    y: lane === "top" ? LANE_Y_TOP : LANE_Y_BOTTOM,
    speed: Math.max(MIN_SPEED, entrySpeed),
    colorIndex: Math.floor(Math.random() * 4)
  })

  return true
}

function updateLane(lane: "top" | "bottom", delta: number){
  const laneCars = cars.value.filter(c => c.lane === lane)
  
  laneCars.sort((a, b) => a.x - b.x)

  const dir: 1 | -1 = lane === "top" ? 1 : -1
  const gapMin = minGapPct()
  const gapBase = baseSafeGapPct()

  for (let i = 0; i < laneCars.length; i++) {
    const c = laneCars[i]
    if (!c) continue
    const ahead = dir === 1 ? laneCars[i + 1] : laneCars[i - 1]
    
    let targetSpeed = FREE_FLOW_SPEED

    if (ahead) {
      const gap = dir === 1 ? ahead.x - c.x : c.x - ahead.x
      const dynamicSafeGap = gapBase - (gapBase - (gapMin + 1)) * energy

      if (gap <= dynamicSafeGap) {
        const factor = (gap - gapMin) / (dynamicSafeGap - gapMin)
        const ratio = smoothstep(factor)
        
        const logicalMin = Math.max(MIN_SPEED, ahead.speed - (5 * (1 - ratio)))
        targetSpeed = logicalMin + ratio * (FREE_FLOW_SPEED - logicalMin)
        
        if (gap < gapMin * 1.3) {
          targetSpeed = Math.min(targetSpeed, ahead.speed)
        }
      }
    } else {
      if (energy > 0.1) {
        targetSpeed = FREE_FLOW_SPEED - (FREE_FLOW_SPEED - MIN_SPEED) * energy
      }
    }

    if (targetSpeed < MIN_SPEED) targetSpeed = MIN_SPEED

    const rate = targetSpeed < c.speed ? ACCEL_DOWN : ACCEL_UP
    c.speed += (targetSpeed - c.speed) * rate * delta

    if (c.speed < MIN_SPEED) c.speed = MIN_SPEED
    if (c.speed > FREE_FLOW_SPEED) c.speed = FREE_FLOW_SPEED

    c.x += dir * c.speed * SPEED_TO_PCT * delta

    if (ahead) {
      const gapAfter = dir === 1 ? ahead.x - c.x : c.x - ahead.x
      if (gapAfter < gapMin) {
        c.x = dir === 1 ? ahead.x - gapMin : ahead.x + gapMin
        c.speed = Math.max(MIN_SPEED, Math.min(c.speed, ahead.speed))
      }
    }
  }
}

function tick(){
  const delta = gsap.ticker.deltaRatio(60)

  if (generating) {
    energy = Math.min(1, energy + 0.008 * delta)
  } else {
    energy = Math.max(0, energy - 0.006 * delta)
  }

  const spawnEnergy = generating ? energy : energy * 0.35
  const spawnInterval = SPAWN_INTERVAL_BASE - (SPAWN_INTERVAL_BASE - SPAWN_INTERVAL_MIN) * spawnEnergy
  const cap = maxCarsPerLane()

  spawnAccTop += 16.6 * delta
  while (spawnAccTop >= spawnInterval) {
    if (trySpawnCar("top", cap)) {
      spawnAccTop -= spawnInterval
    } else {
      spawnAccTop = Math.min(spawnAccTop, spawnInterval)
      break
    }
  }

  spawnAccBottom += 16.6 * delta
  while (spawnAccBottom >= spawnInterval) {
    if (trySpawnCar("bottom", cap)) {
      spawnAccBottom -= spawnInterval
    } else {
      spawnAccBottom = Math.min(spawnAccBottom, spawnInterval)
      break
    }
  }

  updateLane("top", delta)
  updateLane("bottom", delta)

  for (let i = cars.value.length - 1; i >= 0; i--) {
    const c = cars.value[i]
    if (!c) continue
    if ((c.dir === 1 && c.x > 110) || (c.dir === -1 && c.x < -10)) {
      cars.value.splice(i, 1)
    }
  }

  const avgSpeedTarget = cars.value.length
    ? cars.value.reduce((s, c) => s + c.speed, 0) / cars.value.length
    : FREE_FLOW_SPEED

  avgSpeed.value += (avgSpeedTarget - avgSpeed.value) * 0.075 * delta

  updateAlarmState()
}

function onPointerEnter(){
  energy = Math.min(1, energy + 0.08)
  generating = true
}

function onPointerLeave(){
  generating = false
}

onMounted(() => {
  gsap.ticker.add(tick)

  if (road.value) {
    roadWidthPx = road.value.getBoundingClientRect().width || roadWidthPx
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        roadWidthPx = entry.contentRect.width || roadWidthPx
      }
    })
    resizeObserver.observe(road.value)
  }
})

onUnmounted(() => {
  gsap.ticker.remove(tick)
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.traffic-card {
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
  --panel-ink: #17304f;
  --panel-muted: #5d7592;
  --panel-line: rgba(37, 70, 116, .2);
  --panel-accent: #4db6ff;
  --panel-danger: #d93b47;
}

.traffic-card::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 12%, rgba(255, 255, 255, .86), transparent 44%),
    radial-gradient(circle at 86% 82%, rgba(195, 221, 255, .5), transparent 48%);
}

.traffic-card::after {
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

.road {
  position: absolute;
  left: 6%;
  right: 6%;
  top: 92px;
  bottom: 90px;
  overflow: hidden;
  border-radius: 0;
  border: 1px solid rgba(145, 180, 226, .26);
  background:
    linear-gradient(180deg, #6d7f95 0%, #5d6f85 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .08),
    inset 0 -20px 24px rgba(0, 0, 0, .32);
  z-index: 10;
}

.divider {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: repeating-linear-gradient(to right, rgba(230, 242, 255, .9) 0 22px, transparent 22px 44px);
}

.car {
  position: absolute;
  width: 34px;
  height: 16px;
  transform: translateY(-50%);
  z-index: 5;
}

.car.reverse {
  transform: translateY(-50%) scaleX(-1);
}

.car-body {
  position: absolute;
  inset: 2px;
  border-radius: 4px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .32),
    0 0 6px rgba(0, 0, 0, .3);
}

.wheel {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #111821;
  bottom: -1px;
}

.front { right: 5px; }
.rear { left: 5px; }

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
  gap: 8px;
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

.measure-bar {
  position: relative;
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 183, 226, .18);
}

.measure-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff5964 0%, #ffd360 48%, #2be59f 100%);
  transition: width .1s linear;
}

.threshold-marker {
  position: absolute;
  top: -3px;
  width: 3px;
  height: 14px;
  border-radius: 4px;
  background: #ffd360;
}

.threshold-marker.active {
  background: var(--panel-danger);
  box-shadow: 0 0 12px rgba(255, 79, 95, .95);
}

.measure-scale {
  display: flex;
  justify-content: space-between;
  color: var(--panel-muted);
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: .03em;
}

.threshold-label {
  color: #ffd360;
}
</style>