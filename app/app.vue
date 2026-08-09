<template>
    <NuxtLayout>
        <NuxtPage />
    </NuxtLayout>
</template>

<script setup lang="ts">
// Applies the active theme (colors, fonts, shape) as CSS custom
// properties for every route. Called once here rather than per-page or
// per-layout, since app.vue is the one component guaranteed to render
// for every request - see composables/useTheme.ts for what it actually
// does and why the static :root block in nuxt_config.ts is still worth
// keeping (it's the pre-fetch fallback, not dead code).
useTheme();
</script>
