<template>
    <div v-if="config?.enabled !== false" class="chat-root">
        <transition name="panel">
            <div v-if="open" class="chat-panel" role="dialog" :aria-label="title">
                <header class="chat-header">
                    <span class="chat-title">
                        <span class="dot" aria-hidden="true"></span>
                        {{ title }}
                    </span>
                    <span class="chat-actions">
                        <button
                            class="icon-btn"
                            :disabled="!messages.length && !error"
                            title="Ricomincia la conversazione"
                            aria-label="Ricomincia la conversazione"
                            @click="reset"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path
                                    fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round"
                                    d="M20 11a8 8 0 10-2.3 5.7M20 5v6h-6"
                                />
                            </svg>
                        </button>
                        <button
                            class="icon-btn"
                            title="Chiudi"
                            aria-label="Chiudi la chat"
                            @click="toggle"
                        >
                            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                                <path
                                    fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round"
                                    d="M6 6l12 12M18 6L6 18"
                                />
                            </svg>
                        </button>
                    </span>
                </header>

                <div ref="scrollEl" class="chat-log">
                    <div class="msg bot">{{ welcome }}</div>

                    <!-- Chips live inline in the log rather than pinned
                         above the input: they belong to the welcome
                         message, and pinning them would eat vertical
                         space in an already short panel. -->
                    <div v-if="!messages.length && suggestions.length" class="chips">
                        <button
                            v-for="(s, i) in suggestions"
                            :key="i"
                            class="chip"
                            :disabled="pending"
                            @click="ask(s)"
                        >{{ s }}</button>
                    </div>

                    <transition-group name="msg">
                        <div
                            v-for="m in messages"
                            :key="m.id"
                            class="msg"
                            :class="m.role"
                        >{{ m.text }}</div>
                    </transition-group>

                    <div v-if="pending" class="msg bot pending" aria-live="polite">
                        <span></span><span></span><span></span>
                    </div>

                    <p v-if="error" class="chat-error">{{ error }}</p>
                </div>

                <!-- Once a conversation is going, keep the suggestions
                     reachable without re-opening: a compact row above
                     the input, shown only when idle. -->
                <div v-if="messages.length && suggestions.length && !pending" class="chips chips-compact">
                    <button
                        v-for="(s, i) in suggestions.slice(0, 3)"
                        :key="i"
                        class="chip chip-sm"
                        @click="ask(s)"
                    >{{ s }}</button>
                </div>

                <form class="chat-input" @submit.prevent="send">
                    <input
                        ref="inputEl"
                        v-model="draft"
                        type="text"
                        :placeholder="placeholder"
                        :disabled="pending"
                        aria-label="Messaggio"
                        @keydown.esc="toggle"
                    />
                    <button
                        type="submit"
                        class="send-btn"
                        :disabled="pending || !draft.trim()"
                        aria-label="Invia"
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path fill="currentColor" d="M3 20l18-8L3 4v6l12 2-12 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </transition>

        <button
            class="chat-toggle"
            :class="{ 'is-open': open }"
            :aria-expanded="open"
            :aria-label="open ? 'Chiudi la chat' : 'Apri la chat'"
            @click="toggle"
        >
            <!-- Inline SVG rather than emoji: this file is deliberately
                 pure ASCII so it survives being copied between Windows
                 and Linux (a non-ASCII char became mojibake once). -->
            <svg v-if="!open" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                    fill="currentColor"
                    d="M12 3C7 3 3 6.4 3 10.6c0 2.3 1.2 4.4 3.2 5.8L5.5 20l3.7-1.9c.9.2 1.8.3 2.8.3
                       5 0 9-3.4 9-7.8S17 3 12 3z"
                />
            </svg>
            <svg v-else viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    d="M6 6l12 12M18 6L6 18"
                />
            </svg>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";

type Msg = { id: number; role: "user" | "bot"; text: string };

const props = defineProps<{
    config?: {
        enabled?: boolean;
        title?: string;
        welcome_message?: string;
        placeholder?: string;
        suggestions?: string[];
    };
}>();

const runtime = useRuntimeConfig();

const open = ref(false);
const draft = ref("");
const messages = ref<Msg[]>([]);
const pending = ref(false);
const error = ref("");
const scrollEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);

// transition-group needs a stable key per item; the array index is not
// stable enough once messages are cleared and re-added by reset().
let nextId = 0;

/* Accented characters use \u escapes to keep this file ASCII.
   \u00e8 = e-grave   \u2026 = ellipsis */
const title = computed(() => props.config?.title || "Chiedi ad Axatel");

const welcome = computed(
    () => props.config?.welcome_message
        || "Ciao! Posso rispondere a domande su Axatel e le nostre soluzioni."
);

const placeholder = computed(
    () => props.config?.placeholder || "Scrivi una domanda\u2026"
);

// Fallbacks are phrased as real questions because the engine matches on
// semantic similarity against KNOWLEDGE_BASE - a terse menu label like
// "Sede" scores badly and falls through to the generic answer.
const DEFAULT_SUGGESTIONS = [
    "Cosa fa Axatel?",
    "Dove siete?",
    "Cos'\u00e8 Smart Road?",
    "Come vi contatto?",
];

const suggestions = computed(() =>
    props.config?.suggestions?.length
        ? props.config.suggestions
        : DEFAULT_SUGGESTIONS
);

async function toggle() {
    open.value = !open.value;
    if (open.value) {
        await nextTick();
        inputEl.value?.focus();
    }
}

function reset() {
    messages.value = [];
    error.value = "";
    draft.value = "";
    inputEl.value?.focus();
}

async function scrollToBottom() {
    await nextTick();
    if (scrollEl.value) {
        scrollEl.value.scrollTo({
            top: scrollEl.value.scrollHeight,
            behavior: "smooth",
        });
    }
}

/** Send a specific string - used by the suggestion chips. */
function ask(text: string) {
    draft.value = text;
    send();
}

async function send() {
    const text = draft.value.trim();
    if (!text || pending.value) return;

    messages.value.push({ id: nextId++, role: "user", text });
    draft.value = "";
    error.value = "";
    pending.value = true;
    await scrollToBottom();

    try {
        // Always the browser-facing base: this only runs on a click,
        // never during SSR, so the internal container hostname would be
        // wrong here.
        const res = await $fetch<{ response?: string; error?: string }>(
            `${runtime.public.apiBase}/chatbot/chat/`,
            { method: "POST", body: { message: text } }
        );

        if (res?.response) {
            messages.value.push({ id: nextId++, role: "bot", text: res.response });
        } else {
            error.value = res?.error || "Risposta non valida dal server.";
        }
    } catch (e: any) {
        // The FIRST request after a backend restart loads the
        // SentenceTransformer model and builds the embedding index
        // (chatbot/engine.py _ensure_loaded). That takes 30-60s and
        // usually surfaces here as a timeout - a cold start, not a
        // failure. Later requests are fast.
        error.value =
            "Non riesco a rispondere in questo momento. "
            + "Se \u00e8 la prima domanda dopo un riavvio, riprova tra un minuto.";
        console.error("[chatbot]", e);
    } finally {
        pending.value = false;
        await scrollToBottom();
        inputEl.value?.focus();
    }
}
</script>

<style scoped>
.chat-root {
    position: fixed;
    right: 24px;
    bottom: 24px;
    /* Above the navbar (z-index 1000) so the panel is never clipped. */
    z-index: 1001;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 14px;
}

/* -- launcher ------------------------------------------------------ */
.chat-toggle {
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 1px solid var(--ax-color-accent-red-border);
    background: var(--ax-color-bg-surface);
    color: var(--ax-color-accent-red-soft);
    cursor: pointer;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    transition: transform 0.25s cubic-bezier(.22,.61,.36,1),
                background-color 0.2s ease;
}

.chat-toggle:hover {
    transform: translateY(-2px) scale(1.04);
    background: rgba(234, 63, 48, 0.14);
}

.chat-toggle.is-open {
    transform: rotate(90deg);
}

/* -- panel --------------------------------------------------------- */
.chat-panel {
    width: min(380px, calc(100vw - 48px));
    height: min(520px, calc(100vh - 140px));
    display: flex;
    flex-direction: column;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: var(--ax-card-radius);
    background: var(--ax-color-bg-surface);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
    overflow: hidden;
}

.panel-enter-active,
.panel-leave-active {
    transition: opacity 0.22s ease, transform 0.22s cubic-bezier(.22,.61,.36,1);
    transform-origin: bottom right;
}

.panel-enter-from,
.panel-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
}

.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 14px 14px 16px;
    border-bottom: 1px solid var(--ax-color-border-soft);
    font-weight: 700;
    font-size: 0.92rem;
}

.chat-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #2E9B5C;
    box-shadow: 0 0 0 3px rgba(46, 155, 92, 0.18);
}

.chat-actions {
    display: inline-flex;
    gap: 2px;
}

.icon-btn {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ax-color-text-muted);
    cursor: pointer;
    transition: color 0.18s ease, background-color 0.18s ease;
}

.icon-btn:hover:not(:disabled) {
    color: var(--ax-color-text-primary);
    background: rgba(147, 183, 218, 0.12);
}

.icon-btn:disabled {
    opacity: 0.3;
    cursor: default;
}

/* -- log ----------------------------------------------------------- */
.chat-log {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
}

.msg {
    max-width: 84%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
}

.msg.bot {
    align-self: flex-start;
    border-bottom-left-radius: 4px;
    background: rgba(147, 183, 218, 0.12);
    color: var(--ax-color-text-secondary);
}

.msg.user {
    align-self: flex-end;
    border-bottom-right-radius: 4px;
    background: rgba(234, 63, 48, 0.16);
    color: var(--ax-color-text-primary);
}

.msg-enter-active {
    transition: opacity 0.25s ease, transform 0.25s cubic-bezier(.22,.61,.36,1);
}

.msg-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

/* -- chips --------------------------------------------------------- */
.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
}

.chips-compact {
    padding: 0 12px 10px;
    margin-top: 0;
}

.chip {
    padding: 8px 13px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 999px;
    background: transparent;
    color: var(--ax-color-text-secondary);
    font-size: 0.82rem;
    line-height: 1.2;
    cursor: pointer;
    transition: border-color 0.18s ease, color 0.18s ease,
                background-color 0.18s ease, transform 0.18s ease;
}

.chip:hover:not(:disabled) {
    border-color: var(--ax-color-accent-red-border);
    color: var(--ax-color-accent-red-soft);
    background: rgba(234, 63, 48, 0.08);
    transform: translateY(-1px);
}

.chip:disabled {
    opacity: 0.4;
    cursor: default;
}

.chip-sm {
    font-size: 0.76rem;
    padding: 6px 11px;
}

/* -- typing indicator ---------------------------------------------- */
.pending {
    display: flex;
    gap: 4px;
    align-items: center;
}

.pending span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ax-color-text-muted);
    animation: blink 1.2s infinite;
}

.pending span:nth-child(2) { animation-delay: 0.2s; }
.pending span:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
    0%, 60%, 100% { opacity: 0.25; }
    30% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
    .pending span { animation: none; opacity: 0.6; }
    .panel-enter-active,
    .panel-leave-active,
    .msg-enter-active,
    .chat-toggle { transition: none; }
}

.chat-error {
    margin: 0;
    color: var(--ax-color-accent-red-soft);
    font-size: 0.82rem;
    line-height: 1.45;
}

/* -- input --------------------------------------------------------- */
.chat-input {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--ax-color-border-soft);
}

.chat-input input {
    flex: 1;
    min-width: 0;
    padding: 11px 14px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 999px;
    background: var(--ax-color-bg-main);
    color: var(--ax-color-text-primary);
    font-size: 0.9rem;
}

.chat-input input:focus {
    outline: 2px solid var(--ax-color-accent-red-border);
    outline-offset: 1px;
}

.send-btn {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border: 1px solid var(--ax-color-accent-red-border);
    border-radius: 50%;
    background: transparent;
    color: var(--ax-color-accent-red-soft);
    cursor: pointer;
    transition: background-color 0.18s ease, transform 0.18s ease;
}

.send-btn:hover:not(:disabled) {
    background: rgba(234, 63, 48, 0.12);
    transform: scale(1.05);
}

.send-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

@media (max-width: 480px) {
    .chat-root { right: 14px; bottom: 14px; }
    .chat-panel { height: min(70vh, calc(100vh - 110px)); }
}
</style>