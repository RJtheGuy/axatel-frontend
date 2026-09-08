<script setup lang="ts">
const processSteps = [
	{
		number: "01",
		title: "Programmiamo",
		description: "Configuriamo sensori e firmware sulla misura reale da controllare."
	},
	{
		number: "02",
		title: "Installiamo",
		description: "Portiamo la tecnologia sul campo e la integriamo con l'infrastruttura."
	},
	{
		number: "03",
		title: "Raccogliamo",
		description: "Acquisiamo dati continui e affidabili da ogni punto monitorato."
	},
	{
		number: "04",
		title: "Analizziamo",
		description: "Trasformiamo i segnali in informazioni utili e soglie operative."
	},
	{
		number: "05",
		title: "Automatizziamo",
		description: "Attiviamo risposte immediate, come un semaforo rosso in caso di pericolo."
	}
];

function requestDemoScroll(): void {
	window.dispatchEvent(new CustomEvent("axatel-demo-jump"));
}
</script>

<template>
	<section class="spiegazione-section" aria-labelledby="process-title">
		<div class="process-content">
			<header class="process-heading">
				<p class="eyebrow">Dall'hardware alla decisione</p>
				<h2 id="process-title">Gestiamo tutta la filiera.</h2>
				<p class="lead">
					Un unico processo connette il campo, i dati e le azioni. Progettiamo ogni
					passaggio per trasformare una misura in una risposta concreta e tempestiva.
				</p>
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
					<span class="outcome-label">Evento rilevato</span>
					<strong>Un allarme, due livelli di controllo</strong>
				</div>
				<p>
					L'evento raggiunge le piattaforme verticali, come <b>GeoAngel</b> e
					<b>Angel Bridge</b>, e alimenta <b>AngelBPM</b>, dove ogni allarme attiva
					procedure, responsabilità e interventi tracciabili.
				</p>
			</div>
		</div>

		<button
			class="scroll-invite"
			type="button"
			aria-label="Vai alle demo interattive"
			@click="requestDemoScroll"
		>
			<span>Scopri come funziona</span>
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
		background:
			linear-gradient(rgba(2, 7, 18, 0.94), rgba(2, 7, 18, 0.86)),
			radial-gradient(circle at 16% 24%, rgba(121, 207, 255, 0.16) 0 1px, transparent 1.6px);
		background-size: 100% 100%, 28px 28px;
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