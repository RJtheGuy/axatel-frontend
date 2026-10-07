<template>
    <main class="home-page">
        <div class="page-overlay" :class="{ 'is-hidden': isParticleHeroVisible }" aria-hidden="true"></div>
        <DashboardCitazioneSection :content="heroTop" />
        <DashboardDemoSpiegazione />
        <DashboardDemoSection id="applicativi" :applications="dashboardConfig.demo.applications" />
        <DashboardCasiDiSuccessoSection
            id="settori"
            :title="t('home.casesTitle')"
            :cases="dashboardConfig.successCases.items"
            :button-label="dashboardConfig.successCases.buttonLabel"
            :cta-label="t('home.casesCta')"
            :cta-href="dashboardConfig.successCases.cta.href"
        />
        <DashboardHeroParticelleSection
            :frasi="heroFrasi"
            :quote-text="heroQuote"
            :cases-logo-asset="dashboardConfig.hero.casesLogoAsset"
        />
        <!-- <DashboardPartnersSection
            :title="dashboardConfig.partners.title"
            :partners="dashboardConfig.partners.items"
        /> -->
        <DashboardTrustStrip />
        <LayoutSiteFooter />
    </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import DashboardHeroParticelleSection from "../components/dashboard/HeroParticelle.vue";
import { homepageCases } from "../data/homepageCases";
import { byEventDate } from "../utils/caseOrder";

const DashboardDemoSection = defineAsyncComponent(() => import("../components/dashboard/Demo.vue"));
const DashboardDemoSpiegazione = defineAsyncComponent(() => import("../components/dashboard/demo/Spiegazione.vue"));
const DashboardCitazioneSection = defineAsyncComponent(() => import("../components/dashboard/Citazione.vue"));
const DashboardCasiDiSuccessoSection = defineAsyncComponent(() => import("../components/dashboard/CasiDiSuccesso.vue"));
const DashboardPartnersSection = defineAsyncComponent(() => import("../components/dashboard/Partners.vue"));

const isParticleHeroVisible = ref(false);
let sectionSnapTimeout: ReturnType<typeof setTimeout> | null = null;
let isSectionSnapping = false;
const snapSectionSelector = [
    ".citazione-section",
    ".spiegazione-section",
    ".demo-section",
    ".casi-section",
    ".hero",
    ".footer-section"
].join(",");

function canScrollInside(target: EventTarget | null, deltaY: number): boolean {
    let element = target instanceof HTMLElement ? target : null;

    while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        const scrollable = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight;

        if (scrollable) {
            const canScrollDown = deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1;
            const canScrollUp = deltaY < 0 && element.scrollTop > 1;
            if (canScrollDown || canScrollUp) return true;
        }

        element = element.parentElement;
    }

    return false;
}

async function snapToAdjacentSection(direction: 1 | -1): Promise<void> {
    await nextTick();

    const sections = Array.from(document.querySelectorAll<HTMLElement>(snapSectionSelector));
    const target = direction > 0
        ? sections.find((section) => section.getBoundingClientRect().top > 8)
        : sections.findLast((section) => section.getBoundingClientRect().top < -8);

    if (!target) {
        isSectionSnapping = false;
        return;
    }

    target.scrollIntoView({
        block: target.classList.contains("footer-section") ? "end" : "start",
        behavior: "smooth"
    });

    if (sectionSnapTimeout) clearTimeout(sectionSnapTimeout);
    sectionSnapTimeout = setTimeout(() => {
        isSectionSnapping = false;
        sectionSnapTimeout = null;
    }, 850);
}

function handleSectionWheel(event: WheelEvent): void {
    if (!window.matchMedia("(min-width: 901px)").matches) return;
    if (event.ctrlKey || Math.abs(event.deltaY) < 8 || canScrollInside(event.target, event.deltaY)) return;

    event.preventDefault();
    if (isSectionSnapping) return;

    isSectionSnapping = true;
    void snapToAdjacentSection(event.deltaY > 0 ? 1 : -1);
}

function handleParticleHeroVisibility(event: Event): void {
    isParticleHeroVisible.value = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
}

async function revealAndScrollToHash(): Promise<void> {
    const hash = window.location.hash;
    if (!hash) return;

    await nextTick();

    document.querySelector(hash)?.scrollIntoView({ block: "start" });
}

async function revealAndScrollToDemo(): Promise<void> {
    await nextTick();

    await Promise.race([
        new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => resolve());
            });
        }),
        new Promise<void>((resolve) => {
            setTimeout(resolve, 80);
        })
    ]);

    const demo = document.querySelector("#applicativi");
    if (!demo) return;

    const top = demo.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "auto" });
}

onMounted(() => {
    void loadCasiFromCms();
    void loadHomeFromCms();

    if (window.matchMedia("(min-width: 901px)").matches) {
        document.documentElement.classList.add("home-scroll-snap");
        window.addEventListener("wheel", handleSectionWheel, { passive: false });
    }
    window.addEventListener("axatel-hero-visibility", handleParticleHeroVisibility);
    window.addEventListener("axatel-demo-jump", revealAndScrollToDemo);

    if (window.location.hash) {
        void revealAndScrollToHash();
    }

    window.addEventListener("hashchange", revealAndScrollToHash);
});

onBeforeUnmount(() => {
    document.documentElement.classList.remove("home-scroll-snap");
    window.removeEventListener("wheel", handleSectionWheel);
    window.removeEventListener("axatel-hero-visibility", handleParticleHeroVisibility);
    window.removeEventListener("axatel-demo-jump", revealAndScrollToDemo);
    window.removeEventListener("hashchange", revealAndScrollToHash);
    if (sectionSnapTimeout) {
        clearTimeout(sectionSnapTimeout);
        sectionSnapTimeout = null;
    }
    isSectionSnapping = false;
});

// Static fallback content. Everything in here is what the site shows
// immediately and what it falls back to if the CMS is unreachable —
// nothing in the template below changed, only how this object gets
// populated (see loadCasiFromCms / loadFooterFromCms further down).
const dashboardConfig = reactive({
    hero: {
        frasi: [
            "La piattaforma che trasforma i dati in\ndecisioni",
            "La piattaforma che trasforma i dati in\nprevenzione",
            "La piattaforma che trasforma i dati in\nsicurezza",
            "La piattaforma che trasforma i dati in\nrisultati",
            "La piattaforma che trasforma i dati in\nvalore"
        ],
        quoteText: "Tutti noi di Axatel abbiamo un obiettivo in comune:\nabbiamo a cuore ciò che facciamo e l'impatto positivo che generiamo per i nostri partner e per le comunità in cui viviamo e operiamo.\nPer noi è sempre una questione personale\n\n\nElisa Ziglio\nCEO, Axatel",
        // Empty = the homepage wing (CMS one if uploaded).
        casesLogoAsset: ""
    },
    demo: {
        applications: [
            {
                name: "Geo Angel",
                description: "Monitoraggio geologico",
                demo: "GeoAngel",
                instruction: "Colpisci il sensore col mouse per generare l'impatto"
            },
            {
                name: "Traffic Alert",
                description: "Traffico intelligente",
                demo: "TrafficAlert",
                instruction: "Passa il mouse sulla card per aumentare il traffico fino alla congestione"
            },
            {
                name: "Angel River",
                description: "Monitoraggio di fiumi",
                demo: "AngelRiver",
                instruction: "Passa il mouse sulla card per simulare la pioggia e far salire il livello"
            },
            {
                name: "Angel Road Site",
                description: "Gestione cantieri",
                demo: "AngelRoadSite",
                instruction: "Colpisci col mouse il cartello lavori in corso per far scattare l'allarme"
            },
            {
                name: "Angel Bridge",
                description: "Monitoraggio ponti",
                demo: "AngelBridge",
                instruction: "Passa il mouse sulla card per aprire la crepa"
            }
        ]
    },
    successCases: {
        title: "Casi di successo",
        buttonLabel: "Leggi",
        cta: {
            label: "Scopri tutti i casi",
            href: "/casi"
        },
        items:
        // [
        //     {
        //         title: "Automazione e monitoraggio in SS51 Alemagna – BL",
        //         description: "Monitoraggio continuo dei livelli idrici con alert predittivi e interventi anticipati.",
        //         image: "",
        //         slug: "smart-river-guard",
        //         content: [
        //             "Smart River Guard integra sensori idrometrici e allarmi predittivi in una dashboard unica.",
        //             "Il sistema consente ai team operativi di intervenire prima che il livello idrico raggiunga soglie critiche.",
        //             "L'adozione del progetto ha ridotto i tempi di risposta e migliorato il coordinamento tra enti locali."
        //         ],
        //         cliente: "Provincia di Belluno - Anas",
        //         logo_cliente: "",
        //         zona: "San Vito di Cadore - BL",
        //         servizio: "Installazione sensori"
        //     },
        // ],
        homepageCases
    },
    partners: {
        title: "I nostri partner",
        items: [
            {
                name: "Angel",
                logo: "/immagini/Angel.png",
                website: "https://www.axatel.it"
            },
            // {
            //     name: "Smart River Guard",
            //     logo: "",
            //     website: ""
            // },
            // {
            //     name: "Bridge Sentinel",
            //     logo: "",
            //     website: ""
            // },
            // {
            //     name: "Traffic Pulse",
            //     logo: "",
            //     website: ""
            // }
        ]
    }

});

// ── Hero phrases and quote ─────────────────────────────────────────
// Default texts are in i18n/messages-interface.ts ("home"), in all three
// languages. The CMS Home page (panel "Hero") overrides them: in Italian
// always, in English/French only once Home has been translated there, so
// an untranslated Home never puts Italian phrases on the English site.
const { t, tm, rt, locale } = useI18n();
const cmsHero = ref<{ frasi: string[]; quote: string }>({ frasi: [], quote: "" });

const heroFrasi = computed<string[]>(() =>
    cmsHero.value.frasi.length
        ? cmsHero.value.frasi
        : (tm("home.phrases") as unknown[]).map((phrase) => rt(phrase as never))
);
const heroQuote = computed(() => cmsHero.value.quote || t("home.quote"));

// First screen (title, intro, buttons): loaded on the server so visitors and
// Google get the CMS text straight away. English/French use it only once
// Home has been translated, like the phrases below.
const { getPage: getHomeForTop } = useCms();
const { data: heroTop } = await useAsyncData(
    () => `home-top-${locale.value}`,
    async () => {
        const res = await getHomeForTop<any>("home.HomePage", { limit: 1 }).catch(() => null);
        const home = res?.items?.[0];
        if (!home || home.__fallback || home.is_alias) return null;
        return {
            kicker: home.top_kicker || "",
            titleBefore: home.top_title_before || "",
            titleAccent: home.top_title_accent || "",
            titleAfter: home.top_title_after || "",
            intro: home.top_intro || "",
            primaryLabel: home.top_cta_primary_label || "",
            primaryUrl: home.top_cta_primary_url || "",
            secondaryLabel: home.top_cta_secondary_label || "",
            secondaryUrl: home.top_cta_secondary_url || "",
            showStatus: home.top_show_status !== false,
        };
    },
    { watch: [locale] }
);

async function loadHomeFromCms(): Promise<void> {
    try {
        const res = await getPage<any>("home.HomePage", { limit: 1 });
        const home = res?.items?.[0];
        // An English/French Home that only mirrors the Italian one (alias)
        // is not a translation: keep the built-in translated phrases.
        if (!home || home.__fallback || home.is_alias) return;
        const frasi = (Array.isArray(home.hero_frasi) ? home.hero_frasi : [])
            .map((block: any) => String(block?.value ?? "").replace(/\\n/g, "\n").trim())
            .filter(Boolean);
        cmsHero.value = {
            frasi,
            quote: typeof home.hero_quote_text === "string" ? home.hero_quote_text.trim() : "",
        };
    } catch (error) {
        console.warn("[cms] home hero fetch failed, using built-in texts", error);
    }
}

// ── CMS wiring ──────────────────────────────────────────────────────
// dashboardConfig above ships as working, correct content on its own —
// these two calls just overwrite pieces of it in place once (and if)
// the CMS answers, so an editor's changes in Wagtail show up here
// without a deploy. Nothing renders differently while this is pending;
// if it fails, the page quietly keeps the fallback above forever.
const { getPage } = useCms();

async function loadCasiFromCms(): Promise<void> {
    try {
        // Most recent project first ("Data del progetto"), as on /casi.
        const res = await getPage<any>("casi.CasoSuccessoPage", { order: "-first_published_at" }, { all: true, sort: byEventDate });
        if (!res?.items?.length) return;

        dashboardConfig.successCases.items = res.items.map((page) => ({
            title: page.title,
            client: page.client ?? "",
            category: page.category ?? "",
            image: page.cover_image?.url ?? "",
            description: page.description ?? "",
            tags: page.tags ?? [],
            slug: page.meta?.slug ?? "",
            content: page.body ?? ""
        }));
    } catch (error) {
        // CMS down or unreachable — dashboardConfig.successCases.items
        // keeps the fallback nine cases defined above. Fail silent to
        // the visitor, loud to the console for whoever's debugging.
        console.warn("[cms] casi di successo fetch failed, using fallback content", error);
    }
}


useSeoMeta({

    title: () => `Axatel | ${t("seo.homeTitle")}`,

    description: () => t("seo.homeDescription"),

    ogTitle: () => `Axatel | ${t("seo.homeOgTitle")}`,

    ogDescription: () => t("seo.homeOgDescription"),

    ogType: "website",

    robots: "index,follow"

})
</script>

<style scoped>
.home-page {
    position: relative;
    min-height: 100vh;
    background: transparent;
}

.page-overlay {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(90deg, rgba(2, 7, 18, 0.86), rgba(2, 9, 18, 0.62));
    opacity: 1;
    transition: opacity 400ms ease;
}

.page-overlay.is-hidden {
    opacity: 0;
}

.home-page :deep(.citazione-section),
.home-page :deep(.spiegazione-section),
.home-page :deep(.demo-section),
.home-page :deep(.casi-section),
.home-page :deep(.trust-section),
.home-page :deep(.hero) {
    scroll-snap-align: start;
    scroll-snap-stop: always;
}

.home-page :deep(.footer-section) {
    scroll-snap-align: end;
    scroll-snap-stop: always;
}

:global(html.home-scroll-snap) {
    scroll-snap-type: y mandatory;
    scroll-behavior: auto;
}

@media (max-width: 900px) {
    .home-page :deep(.citazione-section),
    .home-page :deep(.spiegazione-section),
    .home-page :deep(.demo-section),
    .home-page :deep(.casi-section),
    .home-page :deep(.trust-section),
    .home-page :deep(.hero),
    .home-page :deep(.footer-section) {
        scroll-snap-align: none;
        scroll-snap-stop: normal;
    }

    :global(html.home-scroll-snap) {
        scroll-snap-type: none;
    }
}
</style>