<template>
    <main class="home-page">
        <div class="page-overlay" :class="{ 'is-hidden': isParticleHeroVisible }" aria-hidden="true"></div>
        <DashboardCitazioneSection />
        <DashboardDemoSpiegazione />
        <DashboardDemoSection id="applicativi" :applications="dashboardConfig.demo.applications" />
        <DashboardCasiDiSuccessoSection
            id="settori"
            :title="dashboardConfig.successCases.title"
            :cases="dashboardConfig.successCases.items"
            :button-label="dashboardConfig.successCases.buttonLabel"
            :cta-label="dashboardConfig.successCases.cta.label"
            :cta-href="dashboardConfig.successCases.cta.href"
        />
        <DashboardHeroParticelleSection
            :frasi="dashboardConfig.hero.frasi"
            :quote-text="dashboardConfig.hero.quoteText"
            :cases-logo-asset="dashboardConfig.hero.casesLogoAsset"
        />
        <!-- <DashboardPartnersSection
            :title="dashboardConfig.partners.title"
            :partners="dashboardConfig.partners.items"
        /> -->
        <DashboardFooterInfo
            :contacts="dashboardConfig.footer.contacts"
            :vat-label="dashboardConfig.footer.vatLabel"
            :vat-value="dashboardConfig.footer.vatValue"
            :tax-label="dashboardConfig.footer.taxLabel"
            :tax-value="dashboardConfig.footer.taxValue"
        />
    </main>
</template>

<script setup lang="ts">
import { homepageCases } from "../data/homepageCases";
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import DashboardHeroParticelleSection from "../components/dashboard/HeroParticelle.vue";
import { socialContacts } from "../data/socialContacts";
import { DASHBOARD_WING_IMAGE } from "@/utils/resolveImage";

const DashboardDemoSection = defineAsyncComponent(() => import("../components/dashboard/Demo.vue"));
const DashboardDemoSpiegazione = defineAsyncComponent(() => import("../components/dashboard/demo/Spiegazione.vue"));
const DashboardCitazioneSection = defineAsyncComponent(() => import("../components/dashboard/Citazione.vue"));
const DashboardCasiDiSuccessoSection = defineAsyncComponent(() => import("../components/dashboard/CasiDiSuccesso.vue"));
const DashboardPartnersSection = defineAsyncComponent(() => import("../components/dashboard/Partners.vue"));
const DashboardFooterInfo = defineAsyncComponent(() => import("../components/dashboard/FooterInfo.vue"));

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
    void loadFooterFromCms();

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
        casesLogoAsset: DASHBOARD_WING_IMAGE
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
    },
    footer: {
        contacts: [
            {
                title: "Chiamaci",
                value: "+39 0444 963891",
                href: "tel:+390444963891"
            },
            {
                title: "Scrivici",
                value: "info@axatel.it",
                href: "mailto:info@axatel.it"
            },
            ...socialContacts,
            {
                title: "Vieni a trovarci",
                value: "Viale del Mercato Nuovo, 75, 36100, Vicenza (VI)",
                href: "https://www.google.com/maps/place/Viale+Mercato+Nuovo,+75,+36100+Vicenza+VI",
                external: true
            }
        ],
        vatLabel: "Partita IVA:",
        vatValue: "IT01234567890",
        taxLabel: "Codice Fiscale:",
        taxValue: "01234567890"
    }
});

// ── CMS wiring ──────────────────────────────────────────────────────
// dashboardConfig above ships as working, correct content on its own —
// these two calls just overwrite pieces of it in place once (and if)
// the CMS answers, so an editor's changes in Wagtail show up here
// without a deploy. Nothing renders differently while this is pending;
// if it fails, the page quietly keeps the fallback above forever.
const { getPage } = useCms();

// site-settings has no dedicated useCms() method yet — this mirrors
// useCms.ts's own server/client base-URL split exactly, so it behaves
// identically to every other CMS call in this project rather than
// introducing a second convention. If a getSiteSettings() method gets
// added to useCms.ts later, swap this out for it.
function apiBase(): string {
    const config = useRuntimeConfig();
    return import.meta.server ? config.apiInternalBase : config.public.apiBase;
}

async function loadCasiFromCms(): Promise<void> {
    try {
        const res = await getPage<any>("casi.CasoSuccessoPage", { order: "-first_published_at" });
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

async function loadFooterFromCms(): Promise<void> {
    try {
        const res = await $fetch<{ footer: any }>(`${apiBase()}/site-settings/`);
        if (!res?.footer) return;

        dashboardConfig.footer.contacts = res.footer.contacts ?? dashboardConfig.footer.contacts;
        dashboardConfig.footer.vatLabel = res.footer.vat_label ?? dashboardConfig.footer.vatLabel;
        dashboardConfig.footer.vatValue = res.footer.vat_value ?? dashboardConfig.footer.vatValue;
        dashboardConfig.footer.taxLabel = res.footer.tax_label ?? dashboardConfig.footer.taxLabel;
        dashboardConfig.footer.taxValue = res.footer.tax_value ?? dashboardConfig.footer.taxValue;
    } catch (error) {
        console.warn("[cms] site settings fetch failed, using fallback footer", error);
    }
}

useSeoMeta({

    title: "Axatel | Piattaforma IoT per monitoraggio, automazione e Smart City",

    description:
        "Axatel sviluppa piattaforme software per il monitoraggio IoT in tempo reale. Soluzioni per infrastrutture, ponti, fiumi, geologia, traffico intelligente e automazione industriale.",

    ogTitle: "Axatel | Piattaforma IoT",

    ogDescription:
        "Monitoraggio intelligente, dashboard in tempo reale, gestione allarmi e analisi dati per Smart City e Industria 4.0.",

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