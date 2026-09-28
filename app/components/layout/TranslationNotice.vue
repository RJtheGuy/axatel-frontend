<template>
    <p class="translation-notice" role="note">
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
        <span>{{ t("fallback.notice") }}</span>
    </p>
</template>

<script setup lang="ts">
// Shown on English/French pages whose content hasn't been translated in
// the CMS yet, so visitors know why the text is in Italian.
const { t } = useI18n();
</script>

<style scoped>
.translation-notice {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 24px;
    padding: 10px 14px;
    border: 1px solid rgba(42, 111, 165, 0.25);
    border-radius: 10px;
    background: rgba(42, 111, 165, 0.07);
    color: #274e72;
    font-size: 0.88rem;
    line-height: 1.45;
}

svg {
    flex: 0 0 18px;
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
}
</style>
