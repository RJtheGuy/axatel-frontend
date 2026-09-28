<template>
    <div>
        <LayoutNavbar/>
        <slot />
        <!-- The homepage renders the footer itself, as the last of its snap sections. -->
        <LayoutSiteFooter v-if="route.path !== '/'" />
        <ChatAiChat />
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
</script>
