// https://nuxt.com/docs/api/configuration/nuxt-config
const publicApiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8001/api/v2'
// With NUXT_PUBLIC_API_BASE=/api/v2 (same-origin, see server/routes/api/v2)
// the CMS pictures still come from the backend address, so allow that one.
const publicApiOrigin = (publicApiBase.startsWith('/')
  ? (process.env.NUXT_API_INTERNAL_BASE || '')
  : publicApiBase).replace(/\/api\/v\d+\/?$/, '')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['~/assets/scss/main.scss'],
  hooks: {
    'build:manifest'(manifest) {
      for (const entry of Object.values(manifest)) {
        if (entry.resourceType === 'video') {
          entry.prefetch = false
          entry.preload = false
        }
      }
    }
  },

  modules: ['@nuxtjs/i18n'],

  // Italian at the normal URLs (/monitoraggio), English and French under
  // /en/… and /fr/…. No automatic redirect by browser language: visitors
  // choose with the switcher in the navbar. Interface strings live in
  // i18n/i18n.config.ts; page content comes translated from the CMS.
  i18n: {
    locales: [
      { code: 'it', language: 'it-IT', name: 'Italiano' },
      { code: 'en', language: 'en-GB', name: 'English' },
      { code: 'fr', language: 'fr-FR', name: 'Français' },
    ],
    defaultLocale: 'it',
    // Absolute address used in hreflang tags. Override at runtime with
    // NUXT_PUBLIC_I18N_BASE_URL (e.g. when the site gets a domain).
    baseUrl: process.env.NUXT_PUBLIC_I18N_BASE_URL || 'http://80.211.135.192',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts',
  },

  // Env vars only reach runtimeConfig if the key is declared here.
  // NUXT_API_INTERNAL_BASE  → runtimeConfig.apiInternalBase
  // NUXT_PUBLIC_API_BASE    → runtimeConfig.public.apiBase
  // Without these declarations both are undefined at runtime, useCms()
  // requests "undefined/pages/", and every CMS fetch fails silently.
  //
  // internal = SSR, container-to-container (web:8000)
  // public   = browser, host-exposed port (localhost:8001)
  runtimeConfig: {
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || 'http://localhost:8001/api/v2',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8001/api/v2',
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'it'
      },
      meta: [
        { name: 'theme-color', content: '#07111d' }
      ],
      // Montserrat is self-hosted from public/fonts (the CSP only allows
      // fonts from 'self'). Without the preload and the @font-face below the
      // font is never loaded and the site renders in Arial/Helvetica.
      // Favicons: dark/light browser themes, iOS home screen, web manifest.
      link: [
        { rel: 'preload', href: '/fonts/montserrat-latin-wght-normal.woff2', as: 'font', type: 'font/woff2', crossorigin: '' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', media: '(prefers-color-scheme: dark)' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon_light_mode.ico', media: '(prefers-color-scheme: light)' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ],
      style: [
        {
          innerHTML: `@font-face{font-family:Montserrat;font-style:normal;font-display:swap;font-weight:100 900;src:url(/fonts/montserrat-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}@font-face{font-family:Montserrat;font-style:normal;font-display:swap;font-weight:100 900;src:url(/fonts/montserrat-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}:root{--ax-color-bg-main:#020712;--ax-color-bg-surface:#070f18;--ax-color-bg-panel:rgba(9,22,34,.74);--ax-color-bg-card-light:#eef2f7;--ax-color-bg-card-soft:#f8fbff;--ax-color-text-primary:#f2f8ff;--ax-color-text-secondary:#c6dcef;--ax-color-text-muted:#9ab6cf;--ax-color-text-dark:#163558;--ax-color-border-soft:rgba(147,183,218,.3);--ax-color-border-card:rgba(169,203,242,.36);--ax-card-radius:18px;--ax-color-accent-red:#c52317;--ax-color-accent-red-soft:#ea3f30;--ax-color-accent-red-border:rgba(255,140,127,.9);--ax-color-overlay-dark-strong:rgba(7,17,29,.92);--ax-color-overlay-dark-medium:rgba(7,17,29,.78);--ax-color-overlay-dark-soft:rgba(7,17,29,.45);--color-primary:var(--ax-color-bg-main);--color-secondary:var(--ax-color-accent-red)}html,body,#__nuxt{width:100%;min-height:100%;margin:0;padding:0;border:0;overflow-x:hidden}html,body{background:var(--ax-color-bg-main)}*{box-sizing:border-box;margin:0;padding:0;font-family:Montserrat,system-ui,-apple-system,'Segoe UI',sans-serif;font-optical-sizing:auto}body{color:var(--ax-color-text-primary)}h1,h2,h3,h4,h5,h6{color:var(--ax-color-text-primary);text-wrap:balance}p,span,small{color:inherit}.ax-cta-outline{display:inline-block;border:1px solid var(--ax-color-accent-red-border);border-radius:999px;background:transparent;color:var(--ax-color-accent-red-soft);text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:.82rem;padding:12px 18px;transition:background-color .2s ease,color .2s ease,border-color .2s ease}.ax-cta-outline:hover{background:rgba(234,63,48,.12);border-color:var(--ax-color-accent-red-soft);color:#ff7366}`
        }
      ]
    }
  },

  routeRules: {
    // '/' was prerendered, which bakes the page at build time. Now that
    // the homepage pulls hero content from Wagtail, prerendering would
    // freeze whatever the CMS held at build and ignore later edits.
    // Re-enable only alongside a rebuild-on-publish webhook.

    // Case studies moved from /articoli/<slug> to /casi/<slug>.
    // 301 so any shared or indexed old links still resolve.
    '/articoli/**': {
      redirect: { to: '/casi/**', statusCode: 301 }
    },
    // "Invia il CV" and "Diventa partner" use the form on /contatti,
    // already set to the right request type (in every language).
    '/azienda/invia-il-cv': {
      redirect: { to: '/contatti?tipo=candidatura#contact-form', statusCode: 302 }
    },
    '/azienda/invia-il-cv/': {
      redirect: { to: '/contatti?tipo=candidatura#contact-form', statusCode: 302 }
    },
    '/azienda/diventa-partner': {
      redirect: { to: '/contatti?tipo=partner#contact-form', statusCode: 302 }
    },
    '/azienda/diventa-partner/': {
      redirect: { to: '/contatti?tipo=partner#contact-form', statusCode: 302 }
    },
    '/en/azienda/invia-il-cv': {
      redirect: { to: '/en/contatti?tipo=candidatura#contact-form', statusCode: 302 }
    },
    '/en/azienda/invia-il-cv/': {
      redirect: { to: '/en/contatti?tipo=candidatura#contact-form', statusCode: 302 }
    },
    '/en/azienda/diventa-partner': {
      redirect: { to: '/en/contatti?tipo=partner#contact-form', statusCode: 302 }
    },
    '/en/azienda/diventa-partner/': {
      redirect: { to: '/en/contatti?tipo=partner#contact-form', statusCode: 302 }
    },
    '/fr/azienda/invia-il-cv': {
      redirect: { to: '/fr/contatti?tipo=candidatura#contact-form', statusCode: 302 }
    },
    '/fr/azienda/invia-il-cv/': {
      redirect: { to: '/fr/contatti?tipo=candidatura#contact-form', statusCode: 302 }
    },
    '/fr/azienda/diventa-partner': {
      redirect: { to: '/fr/contatti?tipo=partner#contact-form', statusCode: 302 }
    },
    '/fr/azienda/diventa-partner/': {
      redirect: { to: '/fr/contatti?tipo=partner#contact-form', statusCode: 302 }
    },

    // The blog became "News" at /news. Old links (shared, bookmarked,
    // indexed by Google) keep working, in every language.
    '/blog': { redirect: { to: '/news', statusCode: 301 } },
    '/blog/**': { redirect: { to: '/news/**', statusCode: 301 } },
    '/en/blog': { redirect: { to: '/en/news', statusCode: 301 } },
    '/en/blog/**': { redirect: { to: '/en/news/**', statusCode: 301 } },
    '/fr/blog': { redirect: { to: '/fr/news', statusCode: 301 } },
    '/fr/blog/**': { redirect: { to: '/fr/news/**', statusCode: 301 } },
    // The old "News, coming soon" placeholder now leads to the real news.
    '/approfondimenti/news': { redirect: { to: '/news', statusCode: 301 } },
    '/en/approfondimenti/news': { redirect: { to: '/en/news', statusCode: 301 } },
    '/fr/approfondimenti/news': { redirect: { to: '/fr/news', statusCode: 301 } },
    // Gallerie was renamed Tunnel (update 17). Built in, so the old address
    // works even where the CMS redirect is missing (e.g. a copy on a PC).
    '/monitoraggio/gallerie': { redirect: { to: '/monitoraggio/tunnel', statusCode: 301 } },
    '/en/monitoraggio/gallerie': { redirect: { to: '/en/monitoraggio/tunnel', statusCode: 301 } },
    '/fr/monitoraggio/gallerie': { redirect: { to: '/fr/monitoraggio/tunnel', statusCode: 301 } },

    '/**': {
      headers: {
        // connect-src was 'self', which blocked every browser-side fetch
        // to the API — different port means different origin. Client
        // requests to localhost:8001 were rejected by the browser before
        // they left the page, with nothing in the server logs.
        // PRODUCTION: replace localhost:8001 with the real API origin.
        //'Content-Security-Policy': `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https: ${publicApiOrigin}; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' ${publicApiOrigin}; form-action 'self'; upgrade-insecure-requests`,
        'Content-Security-Policy': `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https: ${publicApiOrigin}; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' ${publicApiOrigin}; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; form-action 'self'${publicApiBase.startsWith('https://') ? '; upgrade-insecure-requests' : ''}`,
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        ...(publicApiBase.startsWith('https://')
          ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }
          : {})
      }
    },
    '/fonts/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    '/fonts/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    '/_nuxt/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },
    '/immagini/**': {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    }
  },

  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true
    }
  },

  // Bind mounts on /mnt/c (Windows drvfs via WSL2) do not deliver
  // inotify events into the container, so new or edited files are
  // often missed until a restart. Polling costs some CPU but makes
  // hot reload actually work.
  vite: {
    server: {
      watch: { usePolling: true, interval: 300 }
    }
  }
})