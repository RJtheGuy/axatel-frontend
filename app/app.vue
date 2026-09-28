<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// <html lang="…"> and hreflang links for the current language, so search
// engines know /en/… and /fr/… are translations of the Italian pages.
const head = useLocaleHead({ seo: true });
useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs?.lang },
  link: [
    ...(head.value.link || []),
    // Blog RSS feed (server/routes/feed.xml.ts), for feed readers and crawlers.
    { rel: 'alternate', type: 'application/rss+xml', title: 'Axatel Blog', href: '/feed.xml' },
  ],
  meta: [...(head.value.meta || [])],
}));
</script>
