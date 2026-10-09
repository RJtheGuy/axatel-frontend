<template>
    <!-- Information notice (Impostazioni → Footer → Avviso sui cookie).
         Not a consent banner: the site only uses technical storage, so there
         is nothing to accept or refuse. Shown until the visitor presses OK. -->
    <Transition name="cookie-notice">
        <aside v-if="visible" class="cookie-notice" role="region" :aria-label="t('cookieNotice.label')">
            <p>
                {{ text }}
                <NuxtLink v-if="policyUrl" :to="policyUrl" class="cookie-more">{{ t("cookieNotice.more") }}</NuxtLink>
            </p>
            <button type="button" class="cookie-ok" @click="dismiss">{{ t("cookieNotice.ok") }}</button>
        </aside>
    </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

// Remembered in this browser only (listed in the Cookie policy).
const STORAGE_KEY = "ax-cookie-notice-ok";

const { t } = useI18n();
const localePath = useLocalePath();
const { settings } = useSiteSettings();

const notice = computed(() => (settings.value?.footer as any)?.cookie_notice as { enabled?: boolean; text?: string } | undefined);
const text = computed(() => (notice.value?.text || "").trim() || t("cookieNotice.text"));
const policyUrl = computed(() => {
    const url = ((settings.value?.footer as any)?.legal ?? []).find((l: any) => l.kind === "cookie")?.url;
    return url ? localePath(String(url).replace(/\/+$/, "") || "/") : "";
});

// Decided in the browser only, so the server-rendered page never flashes it.
const dismissed = ref(true);
onMounted(() => {
    try {
        dismissed.value = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
        dismissed.value = false;
    }
});
const visible = computed(() => notice.value?.enabled !== false && !dismissed.value);

function dismiss() {
    dismissed.value = true;
    try {
        window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
        /* private mode: hidden for this visit only */
    }
}
</script>

<style scoped>
.cookie-notice {
    position: fixed;
    bottom: 24px;
    left: 24px;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 16px;
    max-width: min(560px, calc(100vw - 120px));
    padding: 14px 16px 14px 20px;
    border: 1px solid var(--ax-color-border-soft);
    border-radius: 14px;
    color: var(--ax-color-text-secondary);
    background: rgba(5, 13, 24, 0.94);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(8px);
}

.cookie-notice p {
    margin: 0;
    font-size: 0.86rem;
    line-height: 1.5;
}

.cookie-more {
    margin-left: 4px;
    color: var(--ax-color-accent-red-soft);
    font-weight: 600;
    white-space: nowrap;
}

.cookie-ok {
    flex-shrink: 0;
    min-width: 64px;
    min-height: 40px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    color: #fff;
    background: var(--ax-color-accent-red);
    font: inherit;
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
}

.cookie-ok:hover {
    background: var(--ax-color-accent-red-soft);
}

.cookie-ok:focus-visible,
.cookie-more:focus-visible {
    outline: 2px solid #8bd9ff;
    outline-offset: 3px;
}

/* Phones: across the bottom, leaving room for the chat button on the right. */
@media (max-width: 640px) {
    .cookie-notice {
        right: 88px;
        bottom: 16px;
        left: 12px;
        max-width: none;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
    }
}

.cookie-notice-enter-active,
.cookie-notice-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}

.cookie-notice-enter-from,
.cookie-notice-leave-to {
    opacity: 0;
    transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
    .cookie-notice-enter-active,
    .cookie-notice-leave-active {
        transition: none;
    }
}
</style>
