// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

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
      style: [
        {
          innerHTML: `:root{--ax-color-bg-main:#020712;--ax-color-bg-surface:#070f18;--ax-color-bg-panel:rgba(9,22,34,.74);--ax-color-bg-card-light:#eef2f7;--ax-color-bg-card-soft:#f8fbff;--ax-color-text-primary:#f2f8ff;--ax-color-text-secondary:#c6dcef;--ax-color-text-muted:#9ab6cf;--ax-color-text-dark:#163558;--ax-color-border-soft:rgba(147,183,218,.3);--ax-color-border-card:rgba(169,203,242,.36);--ax-card-radius:18px;--ax-color-accent-red:#c52317;--ax-color-accent-red-soft:#ea3f30;--ax-color-accent-red-border:rgba(255,140,127,.9);--ax-color-overlay-dark-strong:rgba(7,17,29,.92);--ax-color-overlay-dark-medium:rgba(7,17,29,.78);--ax-color-overlay-dark-soft:rgba(7,17,29,.45);--color-primary:var(--ax-color-bg-main);--color-secondary:var(--ax-color-accent-red)}html,body,#__nuxt{width:100%;min-height:100%;margin:0;padding:0;border:0;overflow-x:hidden}html,body{background:var(--ax-color-bg-main)}*{box-sizing:border-box;margin:0;padding:0;font-family:Montserrat,sans-serif;font-optical-sizing:auto}body{color:var(--ax-color-text-primary)}h1,h2,h3,h4,h5,h6{color:var(--ax-color-text-primary);text-wrap:balance}p,span,small{color:inherit}.ax-cta-outline{display:inline-block;border:1px solid var(--ax-color-accent-red-border);border-radius:999px;background:transparent;color:var(--ax-color-accent-red-soft);text-decoration:none;font-weight:700;text-transform:uppercase;letter-spacing:.04em;font-size:.82rem;padding:12px 18px;transition:background-color .2s ease,color .2s ease,border-color .2s ease}.ax-cta-outline:hover{background:rgba(234,63,48,.12);border-color:var(--ax-color-accent-red-soft);color:#ff7366}`
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

    '/**': {
      headers: {
        // connect-src was 'self', which blocked every browser-side fetch
        // to the API — different port means different origin. Client
        // requests to localhost:8001 were rejected by the browser before
        // they left the page, with nothing in the server logs.
        // PRODUCTION: replace localhost:8001 with the real API origin.
        'Content-Security-Policy': "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; img-src 'self' data: https: http://localhost:8001; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8001; form-action 'self'; upgrade-insecure-requests",
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
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