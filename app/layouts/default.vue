<template>
    <div>
        <LayoutNavbar/>
        <slot />
        <!-- The homepage renders the footer itself, as the last of its snap
             sections (in every language: /, /en, /fr). -->
        <LayoutSiteFooter v-if="!isHome" />
        <!-- Impostazioni → Chatbot: title, welcome message, placeholder,
             suggestions and the "Chatbot attivo" switch. -->
        <ChatAiChat v-if="chatbot?.enabled !== false" :config="chatbot" />
        <!-- Impostazioni → Footer → Avviso sui cookie (information only). -->
        <LayoutCookieNotice />
    </div>
</template>

<script setup lang="ts">
const route = useRoute();
// Route names carry the language: "index___it", "index___en"...
const isHome = computed(() => String(route.name ?? "").split("___")[0] === "index");
// Same shared request as the navbar and footer (one fetch per language).
const { settings } = useSiteSettings();
const chatbot = computed(() => settings.value?.chatbot);
</script>
