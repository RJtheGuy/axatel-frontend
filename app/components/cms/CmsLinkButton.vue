<template>
    <!-- "Pulsante" block: one file or link button, styled in the CMS. -->
    <div class="cms-link-button">
        <CmsLinkButtons :items="[value]" :align="value.align" />
    </div>
</template>

<script setup lang="ts">
import type { LinkButton } from "./CmsLinkButtons.vue";

defineProps<{ value: LinkButton & { align?: "left" | "center" | "right" | "full" } }>();
</script>

<style scoped>
.cms-link-button {
    margin: 4px 0 28px;
}

/* Right under an image (e.g. in "Due colonne"): sit close to its caption. */
.cms-image + .cms-link-button {
    margin-top: -30px;
}

.cms-link-button :deep(.pml) {
    margin-top: 0;
}
</style>
