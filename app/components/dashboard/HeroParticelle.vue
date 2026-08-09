<script setup lang="ts">
import HeroParticelleCanvas from "./hero/HeroParticelleCanvas.vue";

defineProps<{
    frasi?: string[];
    quoteText?: string;
    casesLogoAsset?: string;
}>();
</script>

<template>
    <HeroParticelleCanvas
        :frasi="frasi"
        :quote-text="quoteText"
        :cases-logo-asset="casesLogoAsset"
    />
</template>
