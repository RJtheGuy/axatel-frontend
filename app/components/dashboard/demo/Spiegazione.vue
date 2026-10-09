<script setup lang="ts">
import { computed } from "vue"

// Same five steps as the solution pages ("process.steps" in the i18n files).
const { t: translate, tm, rt } = useI18n()
// The homepage shows these lines without a closing full stop.
const noStop = (text: string) => text.replace(/\.\s*$/, "")
const t = (key: string) => noStop(translate(key))
const processSteps = computed(() =>
	(tm("process.steps") as Array<{ title: unknown; text: unknown }>).map((step, index) => ({
		number: String(index + 1).padStart(2, "0"),
		title: rt(step.title as never),
		description: noStop(rt(step.text as never))
	}))
)

function requestDemoScroll(): void {
	window.dispatchEvent(new CustomEvent("axatel-demo-jump"));
}
</script>

<template>
	<section class="spiegazione-section" aria-labelledby="process-title">
		<div class="process-content">
			<header class="process-heading">
				<p class="eyebrow">{{ t("home.explain.eyebrow") }}</p>
				<h2 id="process-title">{{ t("home.explain.title") }}</h2>
				<p class="lead">{{ t("home.explain.lead") }}</p>
			</header>

			<ol class="process-steps">
				<li v-for="step in processSteps" :key="step.number">
					<div>
						<h3>{{ step.title }}</h3>
						<p>{{ step.description }}</p>
					</div>
				</li>
			</ol>

			<div class="process-outcome">
				<div>
					<span class="outcome-label">{{ t("home.explain.outcomeLabel") }}</span>
					<strong>{{ t("home.explain.outcomeTitle") }}</strong>
				</div>
				<p>
					{{ t("home.explain.outcome1") }} <b>GeoAngel</b> {{ t("home.explain.outcome2") }}
					<b>Angel Bridge</b>{{ t("home.explain.outcome3") }} <b>AngelBPM</b>{{ t("home.explain.outcome4") }}
				</p>
			</div>
		</div>

		<button
			class="scroll-invite"
			type="button"
			:aria-label="t('home.explain.scrollAria')"
			@click="requestDemoScroll"
		>
			<span>{{ t("home.explain.scroll") }}</span>
			<svg class="arrow-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
				<path d="M12 5v14M19 12l-7 7-7-7" />
			</svg>
		</button>
	</section>
</template>

<style scoped>
.spiegazione-section {
	position: relative;
	z-index: 1;
	width: 100vw;
	height: 100vh;
	min-height: 720px;
	overflow: hidden;
	isolation: isolate;
	background: transparent;
}

.process-content {
	position: relative;
	z-index: 2;
	display: grid;
	width: 100%;
	height: 100%;
	padding: clamp(100px, 12vh, 140px) clamp(36px, 7vw, 120px) clamp(72px, 9vh, 96px);
	grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.72fr);
	grid-template-rows: 1fr auto;
	column-gap: clamp(56px, 8vw, 150px);
	align-items: center;
}

.process-heading {
	grid-column: 1;
	align-self: center;
}

.eyebrow,
.outcome-label {
	color: var(--ax-color-accent-red-soft);
	font-size: 0.88rem;
	font-weight: 600;
	letter-spacing: 0.14em;
	text-transform: uppercase;
}

.process-heading h2 {
	max-width: 660px;
	margin: 12px 0 14px;
	font-size: clamp(2.8rem, 4.5vw, 5.2rem);
	font-weight: 250;
	line-height: 1.02;
	letter-spacing: 0;
}

.lead {
	max-width: 650px;
	color: var(--ax-color-text-secondary);
	font-size: clamp(1.14rem, 1.3vw, 1.28rem);
	font-weight: 350;
	line-height: 1.65;
}

.process-steps {
	position: relative;
	display: flex;
	margin: 0;
	padding: 0;
	grid-column: 2;
	grid-row: 1 / 3;
	align-self: center;
	flex-direction: column;
	list-style: none;
}

.process-steps::before {
	content: "";
	position: absolute;
	top: 18px;
	bottom: 18px;
	left: 4px;
	width: 1px;
	background: linear-gradient(to bottom, rgba(234, 63, 48, 0.82), rgba(121, 207, 255, 0.16));
}

.process-steps li {
	position: relative;
	display: grid;
	min-width: 0;
	min-height: clamp(82px, 10vh, 104px);
	padding: 4px 0 14px 34px;
	grid-template-columns: 1fr;
}

.process-steps li::before {
	content: "";
	position: absolute;
	top: 12px;
	left: 0;
	width: 9px;
	height: 9px;
	border-radius: 50%;
	background: var(--ax-color-accent-red-soft);
	border: 2px solid rgba(2, 7, 18, 0.9);
	box-shadow: 0 0 12px rgba(234, 63, 48, 0.7);
}

.process-steps li > div {
	min-width: 0;
}

.process-steps h3 {
	margin: 0 0 5px;
	font-size: clamp(1.04rem, 1.15vw, 1.22rem);
	font-weight: 550;
}

.process-steps p {
	color: var(--ax-color-text-muted);
	font-size: clamp(0.86rem, 0.9vw, 0.96rem);
	font-weight: 350;
	line-height: 1.5;
	overflow-wrap: anywhere;
}

.process-outcome {
	display: grid;
	margin-top: clamp(24px, 4vh, 40px);
	padding: 18px 0;
	grid-column: 1;
	align-self: start;
	grid-template-columns: minmax(180px, 0.72fr) 1.4fr;
	gap: 28px;
	border-top: 1px solid var(--ax-color-border-soft);
	border-bottom: 1px solid var(--ax-color-border-soft);
}

.process-outcome strong {
	display: block;
	margin-top: 7px;
	color: #fff;
	font-size: 1.12rem;
	font-weight: 500;
	line-height: 1.4;
}

.process-outcome p {
	color: var(--ax-color-text-secondary);
	font-size: 1rem;
	font-weight: 350;
	line-height: 1.6;
}

.process-outcome b {
	color: #fff;
	font-weight: 550;
}

.scroll-invite {
	position: absolute;
	bottom: 28px;
	left: 50%;
	z-index: 3;
	display: flex;
	padding: 0;
	align-items: center;
	gap: 12px;
	border: 0;
	background: transparent;
	color: rgba(255, 255, 255, 0.58);
	font: inherit;
	cursor: pointer;
	transform: translateX(-50%);
	transition: color 0.2s ease;
}

.scroll-invite:hover,
.scroll-invite:focus-visible {
	color: #fff;
}

.scroll-invite:focus-visible {
	outline: 2px solid rgba(255, 255, 255, 0.36);
	outline-offset: 7px;
}

.scroll-invite span {
	font-size: 0.78rem;
	font-weight: 450;
	letter-spacing: 0.18em;
	text-transform: uppercase;
}

.arrow-down {
	width: 26px;
	height: 26px;
	animation: float 2s infinite ease-in-out;
}

@keyframes float {
	0%, 100% {
		transform: translateY(0);
		opacity: 0.5;
	}
	50% {
		transform: translateY(5px);
		opacity: 1;
	}
}

@media (max-width: 900px) {
	.spiegazione-section {
		height: auto;
		min-height: 100svh;
		/* Transparent like on desktop: the fixed particle canvas lives
		   behind the page, and an opaque background here hid the wing
		   dissolving into free particles. */
		background: transparent;
	}

	.process-content {
		display: flex;
		width: 100%;
		height: auto;
		min-height: 100svh;
		padding: 100px 7vw 48px;
		flex-direction: column;
		justify-content: center;
	}

	.process-steps {
		width: 100%;
		margin: 32px 0;
	}

	.process-steps li {
		min-height: 0;
		padding: 4px 0 22px 34px;
		grid-template-columns: 1fr;
	}

	.process-steps::before {
		bottom: 32px;
	}

	.process-steps h3 {
		margin-top: 0;
	}

	.process-outcome {
		margin-top: 0;
	}

	.scroll-invite {
		position: relative;
		bottom: auto;
		left: auto;
		margin: 28px auto 0;
		transform: none;
	}
}

@media (max-width: 600px) {
	.process-outcome {
		grid-template-columns: 1fr;
		gap: 12px;
	}

	.scroll-invite span {
		font-size: 0.68rem;
		letter-spacing: 0.12em;
	}
}
</style>