<template>
    <div>
        <LayoutNavbar/>
        <slot />
        <DashboardChatBot :config="settings?.chatbot" />
    </div>
</template>

<script setup lang="ts">
const { settings } = useSiteSettings()
</script>