<template>
    <div class="cms-spacer" :class="`is-${value.size || 'md'}`" aria-hidden="true"></div>
</template>

<script setup lang="ts">
defineProps<{ value: { size?: "sm" | "md" | "lg" } }>();
</script>

<style scoped>
.is-sm { height: 32px; }
.is-md { height: 72px; }
.is-lg { height: 140px; }
</style>
