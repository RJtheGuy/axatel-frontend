<template>
    <div>
        <LayoutNavbar/>
        <slot />
        <!-- Mounted once here rather than per page, so the widget is
             available everywhere. `config` comes from the CMS
             (Impostazioni > Chatbot); the component hides itself when
             enabled is false. -->
        <DashboardChatBot :config="settings?.chatbot" />
        <!-- <footer>
            footer
        </footer> -->
    </div>
</template>

<script setup lang="ts">
const { settings } = useSiteSettings()
</script>