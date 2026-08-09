<template>
<div
	ref="card"
	class="roadsite-card"
	@mousemove="onMouseMove"
	@mouseleave="onMouseLeave"
>

	<div class="sensor" :class="{ alarm: isAlarm }">
		<div class="core">
			<div class="led"></div>
		</div>
		<span class="label">
			{{ isAlarm ? impactValue.toFixed(1) + ' G' : 'Cartello monitorato' }}
		</span>
	</div>

	<div class="site-ground"></div>

	<div class="barrier barrier-a"></div>
	<div class="barrier barrier-b"></div>

	<div
		ref="sign"
		class="road-sign"
		:class="{ fallen: signFallen }"
	>
		<div class="sign-shadow"></div>

		<div class="ground-stand" aria-hidden="true">
			<div class="stand-leg leg-front"></div>
			<div class="stand-leg leg-back"></div>
			<div class="stand-brace"></div>
		</div>

		<div class="triangle-sign" aria-label="Cartello lavori in corso">
			<svg class="roadwork-sign" viewBox="0 0 220 190" role="img" aria-label="Segnale lavori in corso">
				<defs>
					<clipPath id="inner-triangle-works">
						<polygon points="110,26 188,166 32,166" />
					</clipPath>
				</defs>

				<polygon
					points="110,12 206,178 14,178"
					fill="#f2e500"
					stroke="#e01222"
					stroke-width="18"
					stroke-linejoin="round"
				/>

				<g clip-path="url(#inner-triangle-works)">
					<text
						x="110"
						y="156"
						text-anchor="middle"
						font-size="112"
						font-weight="900"
						font-family="Arial, Helvetica, sans-serif"
						fill="#1f1f22"
					>!</text>
				</g>
			</svg>
		</div>
	</div>

</div>
</template>

<script setup lang="ts">
import { ref } from "vue"

const emit = defineEmits<{
	(e: "alarm"): void
	(e: "normal"): void
}>()

const card = ref<HTMLElement | null>(null)
const sign = ref<HTMLElement | null>(null)

const ALARM_DISPLAY_MS = 1300
const RESET_DELAY_MS = 1500
const MIN_IMPACT_SPEED = 0.38
const MAX_G = 5

const isAlarm = ref(false)
const signFallen = ref(false)
const impactValue = ref(0)

let initialized = false
let lastX = 0
let lastY = 0
let lastT = 0
let wasInsideSign = false
let peakSpeed = 0

let alarmTimer: ReturnType<typeof setTimeout> | null = null
let resetTimer: ReturnType<typeof setTimeout> | null = null

function saveAlarm(value: number) {

	const alarms = JSON.parse(localStorage.getItem("alarms") ?? "[]")

	alarms.unshift({
		id: crypto.randomUUID(),
		name: "Lavori in corso",
		unit: "G",
		timestamp: new Date().toISOString(),
		value: Number(value.toFixed(1))
	})

	localStorage.setItem("alarms", JSON.stringify(alarms.slice(0, 100)))
}

function triggerAlarm(speed: number) {

	if (isAlarm.value || speed < MIN_IMPACT_SPEED) {
		return
	}

	const normalized = Math.min(1, speed / 1.2)
	impactValue.value = MAX_G * (0.45 + normalized * 0.55)

	isAlarm.value = true
	signFallen.value = true
	emit("alarm")

	if (alarmTimer) clearTimeout(alarmTimer)
	if (resetTimer) clearTimeout(resetTimer)

	alarmTimer = setTimeout(() => {
		saveAlarm(impactValue.value)
		emit("normal")
	}, ALARM_DISPLAY_MS)

	resetTimer = setTimeout(() => {
		signFallen.value = false
		isAlarm.value = false
		impactValue.value = 0
	}, RESET_DELAY_MS)
}

function onMouseMove(event: MouseEvent) {

	if (!card.value || !sign.value) return

	const now = performance.now()
	const x = event.clientX
	const y = event.clientY

	if (initialized) {
		const dt = now - lastT

		if (dt > 0) {
			const speed = Math.hypot(x - lastX, y - lastY) / dt
			const signRect = sign.value.getBoundingClientRect()
			const insideSign =
				event.clientX >= signRect.left &&
				event.clientX <= signRect.right &&
				event.clientY >= signRect.top &&
				event.clientY <= signRect.bottom

			if (insideSign) {
				peakSpeed = Math.max(peakSpeed, speed)
			}

			if (wasInsideSign && !insideSign) {
				triggerAlarm(peakSpeed)
				peakSpeed = 0
			}

			wasInsideSign = insideSign
		}
	} else {
		initialized = true
	}

	lastX = x
	lastY = y
	lastT = now
}

function onMouseLeave() {
	if (wasInsideSign) {
		triggerAlarm(peakSpeed)
	}

	peakSpeed = 0
	wasInsideSign = false
	initialized = false
}
</script>

<style scoped>
.roadsite-card {
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

.roadsite-card::before {
	content: "";
	position: absolute;
	inset: 0;
	pointer-events: none;
	background:
		radial-gradient(circle at 14% 12%, rgba(255, 255, 255, .86), transparent 44%),
		radial-gradient(circle at 86% 82%, rgba(195, 221, 255, .5), transparent 48%);
}

.roadsite-card::after {
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

.site-ground {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 34%;
	background: linear-gradient(180deg, #95a4b7, #7f8ea2);
	border-top: 1px solid rgba(153, 196, 240, .24);
}

.barrier {
	position: absolute;
	bottom: 24%;
	width: 120px;
	height: 12px;
	border-radius: 5px;
	background: repeating-linear-gradient(90deg, #ff7f32 0 18px, #ffffff 18px 36px);
	box-shadow: 0 4px 10px rgba(0, 0, 0, .35);
}

.barrier-a { left: 14%; }
.barrier-b { right: 14%; }

.road-sign {
	position: absolute;
	left: 52%;
	bottom: 17%;
	width: 200px;
	height: 210px;
	transform-origin: 38% 92%;
	transform: translateX(-50%) rotateY(-18deg) rotateZ(-1.5deg);
	transition: transform .34s cubic-bezier(.2,.8,.2,1), filter .25s ease;
	animation: signIdleSway 3.2s ease-in-out infinite;
	perspective: 900px;
}

.road-sign.fallen {
	transform: translateX(-46%) translateY(20px) rotateY(-8deg) rotateZ(-84deg);
	filter: saturate(.9) brightness(.95);
	animation: none;
}

.sign-shadow {
	position: absolute;
	left: 35%;
	bottom: 6px;
	width: 130px;
	height: 22px;
	border-radius: 999px;
	background: radial-gradient(ellipse at center, rgba(0, 0, 0, .45) 0%, rgba(0, 0, 0, 0) 74%);
	transform: rotate(-6deg);
}

.ground-stand {
	position: absolute;
	inset: 0;
}

.stand-leg {
	position: absolute;
	bottom: 28px;
	width: 11px;
	height: 98px;
	border-radius: 6px;
	background: linear-gradient(180deg, #d3dae4, #8f99a8);
	box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .35);
}

.leg-front {
	left: 78px;
	transform: rotate(9deg);
}

.leg-back {
	left: 122px;
	height: 88px;
	opacity: .85;
	transform: rotate(-8deg);
}

.stand-brace {
	position: absolute;
	left: 82px;
	bottom: 78px;
	width: 44px;
	height: 8px;
	border-radius: 4px;
	background: #9ba5b3;
	transform: rotate(6deg);
}

.triangle-sign {
	position: absolute;
	left: 27px;
	top: 6px;
	width: 158px;
	height: 138px;
	filter: drop-shadow(0 10px 12px rgba(0, 0, 0, .3));
}

.roadwork-sign {
	width: 100%;
	height: 100%;
	display: block;
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
	z-index: 20;
}

.sensor .core{
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

@keyframes signIdleSway {
	0%,
	100% {
		transform: translateX(-50%) rotateY(-18deg) rotateZ(-1.5deg);
	}

	50% {
		transform: translateX(-50%) rotateY(-14deg) rotateZ(1.5deg);
	}
}
</style>