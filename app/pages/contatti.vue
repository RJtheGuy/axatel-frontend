<template>
    <main class="contact-page">
        <DashboardTitoloParticelle class="page-title" title="Contatti" />
        <section class="contact-shell">
            <NuxtLink to="/" class="back-link">Torna alla home</NuxtLink>

            <div class="page-kicker">Parla con un esperto</div>
            <div class="contact-layout">
                <div class="contact-copy">
                    <p class="lead">
                        Indicaci il contesto, le priorita e le aree di interesse: ti aiuteremo a individuare la soluzione piu adatta.
                    </p>

                    <div class="contact-notes">
                        <div>
                            <span>Risposta</span>
                            <strong>Entro pochi giorni lavorativi</strong>
                        </div>
                        <div>
                            <span>Ambiti</span>
                            <strong>IoT, automazione, smart infrastructure</strong>
                        </div>
                    </div>
                </div>

                <form class="contact-form" @submit.prevent="submitForm">
                    <div class="form-grid">
                        <label>
                            Nome e cognome
                            <input v-model="form.name" type="text" name="name" autocomplete="name" required />
                        </label>
                        <label>
                            Azienda / ente
                            <input v-model="form.company" type="text" name="company" autocomplete="organization" />
                        </label>
                        <label>
                            Email
                            <input v-model="form.email" type="email" name="email" autocomplete="email" required />
                        </label>
                        <label>
                            Telefono
                            <input v-model="form.phone" type="tel" name="phone" autocomplete="tel" />
                        </label>
                    </div>

                    <fieldset>
                        <legend>Di cosa vorresti parlare?</legend>
                        <div class="interest-grid">
                            <label v-for="interest in interests" :key="interest" class="interest-option">
                                <input v-model="form.interests" type="checkbox" :value="interest" />
                                <span>{{ interest }}</span>
                            </label>
                        </div>
                    </fieldset>

                    <label>
                        Messaggio
                        <textarea v-model="form.message" name="message" rows="6" placeholder="Descrivi il progetto, il territorio o l'infrastruttura da monitorare."></textarea>
                    </label>

                    <button class="submit-button" type="submit">Invia richiesta</button>
                    <p v-if="submitted" class="form-feedback" role="status">
                        Richiesta preparata. Ti contatteremo usando i riferimenti indicati.
                    </p>
                </form>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import DashboardTitoloParticelle from "../components/dashboard/TitoloParticelle.vue";

const interests = [
    "Monitoraggio fiumi e livelli idrici",
    "Colate detritiche e rischio frane",
    "Ponti e infrastrutture stradali",
    "Gallerie e impianti tecnologici",
    "Traffico intelligente e smart road",
    "Cantieri e sicurezza operativa",
    "Dashboard, allarmi e supervisione",
    "Progetti IoT personalizzati"
];

const submitted = ref(false);
const form = reactive({
    name: "",
    company: "",
    email: "",
    phone: "",
    interests: [] as string[],
    message: ""
});

function submitForm(): void {
    submitted.value = true;
}
</script>

<style scoped>
.contact-page {
    min-height: 100vh;
    padding: 12vh 8vw 9vh;
    background:
        radial-gradient(circle at 14% 12%, rgba(121, 207, 255, 0.18), transparent 35%),
        radial-gradient(circle at 90% 18%, rgba(234, 63, 48, 0.1), transparent 30%),
        var(--ax-color-bg-main);
}

.page-title {
    max-width: 1120px;
    margin: 0 auto 10px;
}

.contact-shell {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0;
}

.back-link {
    display: inline-block;
    margin-bottom: 18px;
    color: var(--ax-color-accent-red-soft);
    text-decoration: none;
    font-weight: 700;
}

.page-kicker {
    margin-bottom: 10px;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.contact-layout {
    display: grid;
    grid-template-columns: minmax(0, 0.8fr) minmax(360px, 1.2fr);
    gap: clamp(28px, 5vw, 72px);
    align-items: start;
}

.lead {
    max-width: 470px;
    margin: 10px 0 28px;
    color: var(--ax-color-text-secondary);
    font-size: 1.02rem;
    line-height: 1.68;
}

.contact-notes {
    display: grid;
    gap: 12px;
    padding-top: 18px;
    border-top: 1px solid var(--ax-color-border-soft);
}

.contact-notes div {
    display: grid;
    gap: 4px;
}

.contact-notes span {
    color: var(--ax-color-text-muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.contact-notes strong {
    color: var(--ax-color-text-primary);
}

.contact-form {
    display: grid;
    gap: 18px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 14px;
    background: rgba(7, 17, 29, 0.32);
    padding: clamp(18px, 3vw, 28px);
    box-shadow: 0 22px 48px rgba(0, 0, 0, 0.22);
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

label,
fieldset {
    min-width: 0;
}

label {
    display: grid;
    gap: 8px;
    color: var(--ax-color-text-primary);
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.02em;
}

input,
textarea {
    width: 100%;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 12px;
    background: rgba(2, 7, 18, 0.5);
    color: var(--ax-color-text-primary);
    padding: 12px 13px;
    font: inherit;
    font-weight: 500;
    outline: none;
}

input:focus,
textarea:focus {
    border-color: var(--ax-color-accent-red-border);
    box-shadow: 0 0 0 3px rgba(234, 63, 48, 0.12);
}

textarea {
    resize: vertical;
}

fieldset {
    margin: 0;
    border: 0;
    padding: 0;
}

legend {
    margin-bottom: 10px;
    color: var(--ax-color-text-primary);
    font-weight: 800;
}

.interest-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.interest-option {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.035);
    padding: 11px 12px;
    cursor: pointer;
}

.interest-option input {
    width: 16px;
    height: 16px;
    accent-color: var(--ax-color-accent-red-soft);
}

.interest-option span {
    color: var(--ax-color-text-secondary);
    font-size: 0.84rem;
    font-weight: 700;
}

.submit-button {
    min-height: 46px;
    border: 1px solid var(--ax-color-accent-red-border);
    border-radius: 999px;
    background: transparent;
    color: var(--ax-color-accent-red-soft);
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.submit-button:hover {
    background: rgba(234, 63, 48, 0.12);
    border-color: var(--ax-color-accent-red-soft);
    color: #ff7366;
}

.form-feedback {
    margin: 0;
    color: var(--ax-color-text-secondary);
    line-height: 1.5;
}

@media (max-width: 900px) {
    .contact-layout,
    .form-grid,
    .interest-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .contact-page {
        padding: 7vh 5vw;
    }

    .contact-form {
        padding: 20px;
    }
}
</style>
