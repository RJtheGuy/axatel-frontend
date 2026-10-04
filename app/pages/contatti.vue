<template>
    <main class="contact-page">
        <DashboardTitoloParticelle class="page-title" :title="t('contact.title')" />
        <section class="contact-shell">
            <NuxtLink :to="localePath('/')" class="back-link">{{ t("common.backHome") }}</NuxtLink>

            <div class="page-kicker">{{ t("contact.kicker") }}</div>
            <div class="contact-layout">
                <div class="contact-copy">
                    <p class="lead">{{ t("contact.lead") }}</p>

                    <div class="contact-notes">
                        <div>
                            <span>{{ t("contact.responseLabel") }}</span>
                            <strong>{{ t("contact.responseValue") }}</strong>
                        </div>
                        <div>
                            <span>{{ t("contact.areasLabel") }}</span>
                            <strong>{{ t("contact.areasValue") }}</strong>
                        </div>
                    </div>
                </div>

                <form class="contact-form" @submit.prevent="submitForm">
                    <div class="form-mode" role="group" :aria-label="t('contact.requestType')">
                        <label class="form-mode-option">
                            <input v-model="form.submission_type" type="radio" value="contact" />
                            <span>{{ t("contact.typeContact") }}</span>
                        </label>
                        <label class="form-mode-option">
                            <input v-model="form.submission_type" type="radio" value="quote" />
                            <span>{{ t("quote.type") }}</span>
                        </label>
                        <label class="form-mode-option">
                            <input v-model="form.submission_type" type="radio" value="candidate" />
                            <span>{{ t("contact.typeCandidate") }}</span>
                        </label>
                    </div>

                    <div class="form-grid">
                        <label>
                            {{ t("contact.name") }}
                            <input v-model="form.name" type="text" name="name" autocomplete="name" required />
                        </label>
                        <label v-if="!isCandidate">
                            {{ t("contact.company") }}
                            <input v-model="form.company" type="text" name="company" autocomplete="organization" />
                        </label>
                        <label>
                            {{ t("contact.email") }}
                            <input v-model="form.email" type="email" name="email" autocomplete="email" required />
                        </label>
                        <label>
                            {{ t("contact.phone") }}
                            <input v-model="form.phone" type="tel" name="phone" autocomplete="tel" />
                        </label>
                    </div>

                    <!-- Quote requests: a few short answers so the team can reply with a proposal. -->
                    <div v-if="form.submission_type === 'quote'" class="form-grid quote-grid">
                        <label class="span-2">
                            {{ t("quote.subject") }}
                            <input v-model="quote.subject" type="text" name="details_subject" maxlength="300" />
                        </label>
                        <label>
                            {{ t("quote.sector") }}
                            <input v-model="quote.sector" type="text" name="details_sector" maxlength="300" :placeholder="t('quote.sectorPlaceholder')" />
                        </label>
                        <label>
                            {{ t("quote.sites") }}
                            <input v-model="quote.sites" type="text" name="details_sites" maxlength="300" inputmode="numeric" />
                        </label>
                        <label class="span-2">
                            {{ t("quote.timeline") }}
                            <select v-model="quote.timeline" name="details_timeline">
                                <option value="">—</option>
                                <option v-for="key in TIMELINES" :key="key" :value="key">{{ t(`quote.timelineOptions.${key}`) }}</option>
                            </select>
                        </label>
                    </div>

                    <!-- Each request type asks only what it needs: topics for a contact,
                         project details for a quote, the CV for an application. -->
                    <label v-if="isCandidate">
                        {{ t("contact.cv") }}
                        <input
                            ref="attachmentInput"
                            type="file"
                            name="attachment"
                            accept=".pdf,.doc,.docx,.odt,.rtf,.txt"
                            @change="selectAttachment"
                        />
                        <small>{{ t("contact.cvHint") }}</small>
                    </label>

                    <fieldset v-if="form.submission_type === 'contact'">
                        <legend>{{ t("contact.interestsLegend") }}</legend>
                        <div class="interest-grid">
                            <label v-for="(interest, index) in interests" :key="interest" class="interest-option">
                                <input v-model="form.interests" type="checkbox" :value="interest" />
                                <!-- The Italian value is what gets submitted, so requests read the same for staff. -->
                                <span>{{ t(`contact.interests.i${index}`) }}</span>
                            </label>
                        </div>
                    </fieldset>

                    <label>
                        {{ isCandidate ? t("contact.messageCandidate") : t("contact.message") }}
                        <textarea v-model="form.message" name="message" rows="6" :placeholder="messagePlaceholder"></textarea>
                    </label>

                    <FormsPrivacyConsent v-model="consent" />

                    <label class="honeypot" aria-hidden="true">
                        Sito web
                        <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" />
                    </label>

                    <button class="submit-button" type="submit" :disabled="submitting">
                        {{ submitting ? t("contact.sending") : submitLabel }}
                    </button>
                    <p v-if="submitted" class="form-feedback" role="status">
                        {{ t("contact.sent") }}
                    </p>
                    <p v-if="submitError" class="form-feedback form-feedback--error" role="alert">
                        {{ submitError }}
                    </p>
                </form>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import DashboardTitoloParticelle from "../components/dashboard/TitoloParticelle.vue";

const { t } = useI18n();
const localePath = useLocalePath();
const route = useRoute();

// Contact submission has no dedicated useCms() method (that composable
// only covers GET-shaped page fetches) — this mirrors its server/client
// base-URL split exactly rather than introducing a second convention.
function apiBase(): string {
    const config = useRuntimeConfig();
    return import.meta.server ? config.apiInternalBase : config.public.apiBase;
}

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

const consent = ref(false);
const { text: consentText } = usePrivacyConsent();
const { locale: siteLocale } = useI18n();
const submitted = ref(false);
const submitting = ref(false);
const submitError = ref("");

const form = reactive({
    name: "",
    company: "",
    email: "",
    phone: "",
    interests: [] as string[],
    message: "",
    submission_type: "contact" as "contact" | "candidate" | "quote",
    website: "",
    attachment: null as File | null,
});

const isCandidate = computed(() => form.submission_type === "candidate");
const attachmentInput = ref<HTMLInputElement | null>(null);
const messagePlaceholder = computed(() =>
    isCandidate.value ? t("contact.messagePlaceholderCandidate")
    : form.submission_type === "quote" ? t("contact.messagePlaceholderQuote")
    : t("contact.messagePlaceholder"));
const submitLabel = computed(() =>
    isCandidate.value ? t("contact.submitCandidate")
    : form.submission_type === "quote" ? t("contact.submitQuote")
    : t("contact.submit"));

// Switching type drops what the new type does not ask for, so nothing
// hidden is sent (topics only for a contact, the CV only for an application).
watch(() => form.submission_type, (type) => {
    if (type !== "contact") form.interests = [];
    if (type !== "candidate") {
        form.attachment = null;
        if (attachmentInput.value) attachmentInput.value.value = "";
    }
});

// Quote mode: /contatti?tipo=preventivo&oggetto=Angel%20River
// (used by the "Richiedi un preventivo" buttons on product and solution pages).
const TIMELINES = ["soon", "mid", "later", "open"] as const;
// Timelines are sent in Italian so requests read the same for staff.
const TIMELINE_IT: Record<string, string> = { soon: "Entro 3 mesi", mid: "Tra 3 e 6 mesi", later: "Oltre 6 mesi", open: "Da definire" };
const quote = reactive({ subject: "", sector: "", sites: "", timeline: "" });

function applyQuery(): void {
    const tipo = String(route.query.tipo ?? "");
    const oggetto = String(route.query.oggetto ?? "").slice(0, 300);
    if (tipo === "preventivo") form.submission_type = "quote";
    else if (tipo === "candidatura") form.submission_type = "candidate";
    if (oggetto) quote.subject = oggetto;
}
applyQuery();
watch(() => route.query, applyQuery);

useSeoMeta({
    title: () => `${form.submission_type === "quote" ? t("project.quote") : t("contact.title")} | Axatel`,
    description: () => t("contact.lead"),
    robots: "index,follow",
});

function selectAttachment(event: Event): void {
    const input = event.target as HTMLInputElement;
    form.attachment = input.files?.[0] ?? null;
}

async function submitForm(): Promise<void> {
    submitError.value = "";
    submitted.value = false;
    submitting.value = true;

    try {
        const body = new FormData();
        body.append("name", form.name);
        body.append("company", isCandidate.value ? "" : form.company);
        body.append("email", form.email);
        body.append("phone", form.phone);
        body.append("message", form.message);
        body.append("submission_type", form.submission_type);
        body.append("website", form.website);
        body.append("privacy", consent.value ? "true" : "");
        body.append("consent_text", consentText.value);
        body.append("locale", siteLocale.value);
        if (form.submission_type === "contact") form.interests.forEach((interest) => body.append("interests", interest));
        if (form.attachment && form.submission_type === "candidate") body.append("attachment", form.attachment);
        if (form.submission_type === "quote") {
            if (quote.subject) body.append("details_subject", quote.subject);
            if (quote.sector) body.append("details_sector", quote.sector);
            if (quote.sites) body.append("details_sites", quote.sites);
            if (quote.timeline) body.append("details_timeline", TIMELINE_IT[quote.timeline] ?? quote.timeline);
        }

        await $fetch(`${apiBase()}/contact/`, {
            method: "POST",
            body
        });

        submitted.value = true;
        form.name = "";
        form.company = "";
        form.email = "";
        form.phone = "";
        form.interests = [];
        form.message = "";
        form.submission_type = "contact";
        form.website = "";
        form.attachment = null;
        Object.assign(quote, { subject: "", sector: "", sites: "", timeline: "" });
    } catch (error) {
        // Backend validation error or the endpoint being unreachable —
        // either way, tell the visitor honestly rather than showing the
        // "Richiesta inviata" message the old handler always showed.
        submitError.value =
            t("contact.error");
        console.warn("[contact] submission failed", error);
    } finally {
        submitting.value = false;
    }
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

.quote-grid .span-2 {
    grid-column: 1 / -1;
}

select {
    width: 100%;
    min-height: 46px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 12px;
    padding: 0 12px;
    background: rgba(2, 7, 18, 0.5);
    color: var(--ax-color-text-primary);
    font: inherit;
}

select:focus {
    border-color: var(--ax-color-accent-red-border);
    outline: none;
}

select option {
    background: #07111d;
}

.form-mode {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.form-mode-option {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 999px;
    padding: 10px 12px;
    cursor: pointer;
}

.form-mode-option input {
    width: 16px;
    height: 16px;
    accent-color: var(--ax-color-accent-red-soft);
}

.form-mode-option span {
    color: var(--ax-color-text-secondary);
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

.honeypot {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
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

.form-feedback--error {
    color: var(--ax-color-accent-red-soft);
}

.submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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