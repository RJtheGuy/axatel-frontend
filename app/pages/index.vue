<template>
    <main>
        <DashboardHeroParticelleSection
            :frasi="dashboardConfig.hero.frasi"
            :quote-text="dashboardConfig.hero.quoteText"
            :cases-logo-asset="dashboardConfig.hero.casesLogoAsset"
        />
        <div ref="contentSentinel" class="content-sentinel" aria-hidden="true"></div>
        <template v-if="showDeferredContent">
            <DashboardDemoSection id="applicativi" :applications="dashboardConfig.demo.applications" />
            <DashboardCitazioneSection />
            <DashboardCasiDiSuccessoSection
                id="settori"
                :title="dashboardConfig.successCases.title"
                :cases="dashboardConfig.successCases.items"
                :button-label="dashboardConfig.successCases.buttonLabel"
                :cta-label="dashboardConfig.successCases.cta.label"
                :cta-href="dashboardConfig.successCases.cta.href"
            />
            <DashboardPartnersSection
                :title="dashboardConfig.partners.title"
                :partners="dashboardConfig.partners.items"
            />
            <DashboardFooterInfo
                :contacts="dashboardConfig.footer.contacts"
                :vat-label="dashboardConfig.footer.vatLabel"
                :vat-value="dashboardConfig.footer.vatValue"
                :tax-label="dashboardConfig.footer.taxLabel"
                :tax-value="dashboardConfig.footer.taxValue"
            />
        </template>
    </main>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import DashboardHeroParticelleSection from "../components/dashboard/HeroParticelle.vue";

const DashboardDemoSection = defineAsyncComponent(() => import("../components/dashboard/Demo.vue"));
const DashboardCitazioneSection = defineAsyncComponent(() => import("../components/dashboard/Citazione.vue"));
const DashboardCasiDiSuccessoSection = defineAsyncComponent(() => import("../components/dashboard/CasiDiSuccesso.vue"));
const DashboardPartnersSection = defineAsyncComponent(() => import("../components/dashboard/Partners.vue"));
const DashboardFooterInfo = defineAsyncComponent(() => import("../components/dashboard/FooterInfo.vue"));

/* ── CMS ────────────────────────────────────────────────────────────
 * Both fetches fail soft. The homepage must render even if Django is
 * down or the casi app hasn't been created yet — the DEFAULT_* consts
 * below carry the original hardcoded content as a fallback.
 * ------------------------------------------------------------------ */
const { getPage } = useCms();

const { data: homeData } = await useAsyncData("home", () =>
    getPage("home.HomePage").catch(() => null)
);
const home = computed(() => homeData.value?.items?.[0]);

const { data: casiData } = await useAsyncData("casi-successo", () =>
    getPage("casi.CasoSuccessoPage", { order: "-first_published_at" }).catch(() => null)
);

/* ── Deferred content reveal (unchanged) ───────────────────────────── */
const showDeferredContent = ref(false);
const contentSentinel = ref<HTMLElement | null>(null);
let contentObserver: IntersectionObserver | null = null;
let scrollRevealRaf = 0;
const scrollIntentKeys = new Set(["ArrowDown", "PageDown", "End", " "]);

function revealDeferredContent(): void {
    if (showDeferredContent.value) return;

    showDeferredContent.value = true;
    contentObserver?.disconnect();
    contentObserver = null;
    removeScrollIntentListeners();
}

function revealOnPointerScrollIntent(): void {
    revealDeferredContent();
}

function revealOnKeyboardScrollIntent(event: KeyboardEvent): void {
    if (!scrollIntentKeys.has(event.key)) return;

    revealDeferredContent();
}

function addScrollIntentListeners(): void {
    window.addEventListener("wheel", revealOnPointerScrollIntent, { passive: true });
    window.addEventListener("touchmove", revealOnPointerScrollIntent, { passive: true });
    window.addEventListener("keydown", revealOnKeyboardScrollIntent);
}

function removeScrollIntentListeners(): void {
    window.removeEventListener("wheel", revealOnPointerScrollIntent);
    window.removeEventListener("touchmove", revealOnPointerScrollIntent);
    window.removeEventListener("keydown", revealOnKeyboardScrollIntent);
}

async function revealAndScrollToHash(): Promise<void> {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    revealDeferredContent();
    await nextTick();

    // window.location.hash is arbitrary input — anything can land there,
    // including strings that are not valid CSS selectors (e.g.
    // "#pagina-casso/" with a trailing slash, produced by a Wagtail
    // link). querySelector THROWS on an invalid selector rather than
    // returning null, and this runs inside onMounted, so that exception
    // aborted the rest of the mount and left the scroll listeners and
    // IntersectionObserver unattached.
    let target: Element | null = null;
    try {
        target = document.querySelector(hash);
    } catch {
        // Not selector-safe — fall back to a literal id lookup, which
        // accepts any characters.
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
    }

    target?.scrollIntoView({ block: "start" });
}

async function revealAndScrollToDemo(): Promise<void> {
    revealDeferredContent();
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

function revealOnIntent(): void {
    if (scrollRevealRaf || showDeferredContent.value) return;

    scrollRevealRaf = requestAnimationFrame(() => {
        scrollRevealRaf = 0;

        if (window.scrollY > 24) {
            revealDeferredContent();
        }
    });
}

onMounted(() => {
    addScrollIntentListeners();
    window.addEventListener("axatel-demo-jump", revealAndScrollToDemo);

    if (window.location.hash) {
        void revealAndScrollToHash();
    }

    if (!contentSentinel.value || !("IntersectionObserver" in window)) {
        window.addEventListener("scroll", revealOnIntent, { passive: true });
        window.addEventListener("hashchange", revealAndScrollToHash);
        return;
    }

    contentObserver = new IntersectionObserver(
        (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                revealDeferredContent();
            }
        },
        {
            rootMargin: "0px 0px -40% 0px",
            threshold: 0
        }
    );

    contentObserver.observe(contentSentinel.value);
    window.addEventListener("scroll", revealOnIntent, { passive: true });
    window.addEventListener("hashchange", revealAndScrollToHash);
});

onBeforeUnmount(() => {
    contentObserver?.disconnect();
    contentObserver = null;
    removeScrollIntentListeners();
    window.removeEventListener("axatel-demo-jump", revealAndScrollToDemo);
    window.removeEventListener("scroll", revealOnIntent);
    window.removeEventListener("hashchange", revealAndScrollToHash);
    if (scrollRevealRaf) {
        cancelAnimationFrame(scrollRevealRaf);
        scrollRevealRaf = 0;
    }
});

/* ── Fallback content ───────────────────────────────────────────────
 * Identical to what was previously hardcoded. Used until the matching
 * CMS content exists, or if a fetch fails.
 * ------------------------------------------------------------------ */

const DEFAULT_FRASI = [
    "La piattaforma che trasforma i dati in\ndecisioni",
    "La piattaforma che trasforma i dati in\nprevenzione",
    "La piattaforma che trasforma i dati in\nsicurezza",
    "La piattaforma che trasforma i dati in\nrisultati",
    "La piattaforma che trasforma i dati in\nvalore"
];

const DEFAULT_QUOTE = "Tutti noi di Axatel abbiamo un obiettivo in comune:\nabbiamo a cuore ciò che facciamo e l'impatto positivo che generiamo per i nostri partner e per le comunità in cui viviamo e operiamo.\nPer noi è sempre una questione personale\n\n\nElisa Ziglio\nCEO, Axatel";

const DEFAULT_LOGO = "/immagini/Angel.png";

/* Each entry's `demo` maps to an actual .vue component (GeoAngel.vue,
 * TrafficAlert.vue, …) — code, not content. Left hardcoded on purpose:
 * making this CMS-editable would let an editor type a component name
 * that doesn't exist, with no validation and a blank section as the
 * only symptom. If it needs to be editable later, model it as a
 * ChoiceBlock with these five fixed options, never a free-text field. */
const DEFAULT_APPLICATIONS = [
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
];

/* Fallback only — the real content now lives in casi.CasoSuccessoPage.
 * Kept minimal here deliberately: the full nine-case array with its HTML
 * bodies has moved to casi/casi_data.py and been seeded into the CMS.
 * Duplicating it here would mean two sources of truth drifting apart. */
const DEFAULT_SUCCESS_CASES = [
    {
        title: "Angel River",
        description: "Monitoraggio continuo dei livelli idrici con alert predittivi e interventi anticipati.",
        image: "",
        slug: "angel-river-il-sistema-di-monitoraggio-dei-livelli-dei-corsi-dacqua"
    }
];

/* PartnerLogosBlock (core/blocks_sections.py) currently stores only
 * heading + a list of images — no per-logo name or website. Until that
 * block gains those two fields, partners stay hardcoded. */
const DEFAULT_PARTNERS = [
    {
        name: "Angel",
        logo: "/immagini/Angel.png",
        website: "https://www.axatel.it"
    }
];

/* Company registration details. Low churn, and duplicated on every page
 * that renders a footer — a good candidate for a Wagtail snippet or the
 * SiteTheme model so it's edited in one place. Hardcoded for now. */
const DEFAULT_FOOTER_CONTACTS = [
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
    {
        title: "Seguici",
        value: "su Linkedin",
        href: "https://www.linkedin.com/company/axatel/",
        external: true
    },
    {
        title: "Vieni a trovarci",
        value: "Viale del Mercato Nuovo, 75, 36100, Vicenza (VI)",
        href: "https://www.google.com/maps/place/Viale+Mercato+Nuovo,+75,+36100+Vicenza+VI",
        external: true
    }
];

const dashboardConfig = computed(() => ({
    hero: {
        // hero_frasi is a StreamField: [{ type: "frase", value: "...", id }]
        frasi: home.value?.hero_frasi?.length
            ? home.value.hero_frasi.map((b: any) => b.value)
            : DEFAULT_FRASI,
        quoteText: home.value?.hero_quote_text || DEFAULT_QUOTE,
        casesLogoAsset: home.value?.hero_cases_logo?.url || DEFAULT_LOGO
    },
    demo: {
        applications: DEFAULT_APPLICATIONS
    },
    successCases: {
        title: "Casi di successo",
        buttonLabel: "Leggi",
        cta: {
            label: "Scopri tutti i casi",
            href: "/casi"
        },
        items: casiData.value?.items?.length
            ? casiData.value.items.map((c: any) => ({
                  title: c.title,
                  description: c.description,
                  image: c.cover_image?.url || "",
                  slug: c.meta?.slug,
                  client: c.client,
                  category: c.category,
                  tags: c.tags || []
                  // NOTE: `content` is deliberately not passed. The card
                  // only needs title/description/image; the article page
                  // fetches the full body by slug. See CasiDiSuccesso.vue.
              }))
            : DEFAULT_SUCCESS_CASES
    },
    partners: {
        title: "I nostri partner",
        items: DEFAULT_PARTNERS
    },
    footer: {
        contacts: DEFAULT_FOOTER_CONTACTS,
        vatLabel: "Partita IVA:",
        vatValue: "IT01234567890",
        taxLabel: "Codice Fiscale:",
        taxValue: "01234567890"
    }
}));

useSeoMeta({
    title: "Axatel | Piattaforma IoT per monitoraggio, automazione e Smart City",

    description:
        "Axatel sviluppa piattaforme software per il monitoraggio IoT in tempo reale. Soluzioni per infrastrutture, ponti, fiumi, geologia, traffico intelligente e automazione industriale.",

    ogTitle: "Axatel | Piattaforma IoT",

    ogDescription:
        "Monitoraggio intelligente, dashboard in tempo reale, gestione allarmi e analisi dati per Smart City e Industria 4.0.",

    ogType: "website",

    robots: "index,follow"
});
</script>