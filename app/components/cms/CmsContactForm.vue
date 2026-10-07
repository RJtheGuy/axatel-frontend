<template>
    <section id="modulo" class="cms-contact-form" :aria-labelledby="headingId">
        <h2 v-if="value.heading" :id="headingId">{{ value.heading }}</h2>
        <p v-if="value.intro" class="intro">{{ value.intro }}</p>

        <form class="form" @submit.prevent="submit">
            <div class="grid">
                <label>
                    {{ t("contact.name") }} *
                    <input v-model="form.name" type="text" name="name" autocomplete="name" required />
                </label>
                <label v-if="value.show_company">
                    {{ t("contact.company") }}
                    <input v-model="form.company" type="text" name="company" autocomplete="organization" />
                </label>
                <label>
                    {{ t("contact.email") }} *
                    <input v-model="form.email" type="email" name="email" autocomplete="email" required />
                </label>
                <label v-if="value.show_phone">
                    {{ t("contact.phone") }}
                    <input v-model="form.phone" type="tel" name="phone" autocomplete="tel" />
                </label>
            </div>

            <label v-if="value.show_message">
                {{ t("contact.message") }}
                <textarea v-model="form.message" name="message" rows="5"></textarea>
            </label>

            <label v-if="value.show_attachment">
                {{ t("contact.cv") }}
                <input type="file" name="attachment" accept=".pdf,.doc,.docx,.odt,.rtf,.txt" @change="pickFile" />
                <small>{{ t("contact.cvHint") }}</small>
            </label>

            <FormsPrivacyConsent v-model="consent" class="consent-row" />

            <label class="honeypot" aria-hidden="true">
                Sito web
                <input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" />
            </label>

            <button class="submit" type="submit" :disabled="sending">
                {{ sending ? t("contact.sending") : value.submit_label || t("contact.submit") }}
            </button>
            <p v-if="sent" class="feedback" role="status">{{ value.success_message || t("contact.sent") }}</p>
            <p v-if="error" class="feedback feedback--error" role="alert">{{ error }}</p>
        </form>
    </section>
</template>

<script setup lang="ts">
// "Modulo di contatto": the contact form right on a page (e.g. Diventa
// partner, Invia il CV). Requests go to the same place as /contatti
// (django-admin → Richieste di contatto) with the type chosen in the CMS.
import { reactive, ref, useId } from "vue";

const props = defineProps<{
    value: {
        heading?: string;
        intro?: string;
        form_type?: string;
        show_company?: boolean;
        show_phone?: boolean;
        show_message?: boolean;
        show_attachment?: boolean;
        submit_label?: string;
        success_message?: string;
    };
}>();

const { t, locale } = useI18n();
const consent = ref(false);
const { text: consentText } = usePrivacyConsent();
const headingId = `contact-form-${useId()}`;

const form = reactive({ name: "", company: "", email: "", phone: "", message: "", website: "", file: null as File | null });
const sending = ref(false);
const sent = ref(false);
const error = ref("");

function pickFile(event: Event): void {
    form.file = (event.target as HTMLInputElement).files?.[0] ?? null;
}

function apiBase(): string {
    const config = useRuntimeConfig();
    return import.meta.server ? config.apiInternalBase : config.public.apiBase;
}

async function submit(): Promise<void> {
    error.value = "";
    sent.value = false;
    if (form.file && form.file.size > 10 * 1024 * 1024) {
        error.value = t("contact.error");
        return;
    }
    sending.value = true;
    try {
        const body = new FormData();
        body.append("name", form.name);
        body.append("company", form.company);
        body.append("email", form.email);
        body.append("phone", form.phone);
        body.append("message", form.message);
        body.append("website", form.website);
        body.append("submission_type", props.value.form_type || "contact");
        body.append("privacy", consent.value ? "true" : "");
        body.append("consent_text", consentText.value);
        body.append("locale", locale.value);
        if (form.file && props.value.show_attachment) body.append("attachment", form.file);
        await $fetch(`${apiBase()}/contact/`, { method: "POST", body });
        sent.value = true;
        Object.assign(form, { name: "", company: "", email: "", phone: "", message: "", website: "", file: null });
        consent.value = false;
    } catch (err) {
        error.value = t("contact.error");
        console.warn("[contact form] submission failed", err);
    } finally {
        sending.value = false;
    }
}
</script>

<style scoped>
.cms-contact-form {
    max-width: var(--cms-measure, 760px);
    margin: 12px auto 28px;
    padding: 26px 28px;
    border: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
    border-radius: 16px;
    background: var(--cms-surface, rgba(255, 255, 255, 0.04));
    color: var(--cms-text, var(--ax-color-text-secondary));
    scroll-margin-top: calc(var(--ax-navbar-height, 74px) + 16px);
}

h2 {
    margin: 0 0 8px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.3rem, 2.4vw, 1.65rem);
    font-weight: 500;
}

.intro {
    margin: 0 0 18px;
    line-height: 1.6;
}

.form {
    display: grid;
    gap: 14px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

label {
    display: grid;
    gap: 6px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: 0.84rem;
    font-weight: 600;
}

input,
textarea {
    width: 100%;
    padding: 11px 13px;
    border: 1px solid var(--cms-border, rgba(147, 183, 218, 0.3));
    border-radius: 10px;
    background: #fff;
    color: #0b355b;
    font: inherit;
    font-weight: 400;
}

input[type="file"] {
    padding: 9px;
}

input:focus,
textarea:focus {
    outline: 2px solid #8bd9ff;
    outline-offset: 1px;
}

textarea {
    resize: vertical;
}

small {
    color: var(--cms-text, var(--ax-color-text-secondary));
    font-weight: 400;
}

.consent-row {
    color: var(--cms-text, var(--ax-color-text-secondary));
}

.honeypot {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
}

.submit {
    justify-self: start;
    min-height: 44px;
    padding: 0 22px;
    border: 0;
    border-radius: 999px;
    background: var(--ax-color-accent-red, #c52317);
    color: #fff;
    font: inherit;
    font-weight: 650;
    cursor: pointer;
}

.submit:hover {
    background: var(--ax-color-accent-red-soft, #ea3f30);
}

.submit:disabled {
    opacity: 0.6;
    cursor: wait;
}

.feedback {
    margin: 0;
    color: #1d7a46;
    font-weight: 600;
}

.feedback--error {
    color: #c52317;
}

@media (max-width: 640px) {
    .cms-contact-form {
        padding: 22px 18px;
    }

    .grid {
        grid-template-columns: 1fr;
    }
}
</style>
