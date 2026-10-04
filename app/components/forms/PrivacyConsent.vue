<template>
    <!-- Required consent checkbox, with a link to the privacy notice (new tab,
         so what was typed in the form is not lost). -->
    <label class="consent">
        <input
            type="checkbox"
            name="privacy"
            required
            :checked="modelValue"
            @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
        <span>
            {{ t("consent.before") }}<a :href="href" target="_blank" rel="noopener">{{ t("consent.link") }}</a>{{ t("consent.after") }} *
        </span>
    </label>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
defineEmits<{ "update:modelValue": [value: boolean] }>();
const { t } = useI18n();
const { href } = usePrivacyConsent();
</script>

<style scoped>
.consent {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.5;
    cursor: pointer;
}

.consent input {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    margin: 2px 0 0;
    accent-color: #c52317;
}

.consent a {
    color: inherit;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
}
</style>
