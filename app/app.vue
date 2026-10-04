<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// <html lang="…"> and hreflang links for the current language, so search
// engines know /en/… and /fr/… are translations of the Italian pages.
const head = useLocaleHead({ seo: true });
// translate="no": the site has its own Italian/English/French versions.
// A browser translator (Chrome/Google Translate) rewrites the page's text
// behind Vue's back, after which the language switch, the chatbot and the
// demo stop updating (Vue can no longer find the text it put there).
useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs?.lang, translate: 'no' },
  link: [
    ...(head.value.link || []),
    // Blog RSS feed (server/routes/feed.xml.ts), for feed readers and crawlers.
    { rel: 'alternate', type: 'application/rss+xml', title: 'Axatel News', href: '/feed.xml' },
  ],
  meta: [...(head.value.meta || []), { name: 'google', content: 'notranslate' }],
}));
</script>
