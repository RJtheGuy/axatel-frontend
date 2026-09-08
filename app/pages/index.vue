<template>
    <main class="home-page">
        <div ref="contentSentinel" class="content-sentinel" aria-hidden="true"></div>
        <div class="page-overlay" :class="{ 'is-hidden': isParticleHeroVisible }" aria-hidden="true"></div>
        <DashboardCitazioneSection />
        <template v-if="showDeferredContent">
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
        </template>
    </main>
</template>

<script setup lang="ts">
import { defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import DashboardHeroParticelleSection from "../components/dashboard/HeroParticelle.vue";

const DashboardDemoSection = defineAsyncComponent(() => import("../components/dashboard/Demo.vue"));
const DashboardDemoSpiegazione = defineAsyncComponent(() => import("../components/dashboard/demo/Spiegazione.vue"));
const DashboardCitazioneSection = defineAsyncComponent(() => import("../components/dashboard/Citazione.vue"));
const DashboardCasiDiSuccessoSection = defineAsyncComponent(() => import("../components/dashboard/CasiDiSuccesso.vue"));
const DashboardPartnersSection = defineAsyncComponent(() => import("../components/dashboard/Partners.vue"));
const DashboardFooterInfo = defineAsyncComponent(() => import("../components/dashboard/FooterInfo.vue"));

const showDeferredContent = ref(false);
const isParticleHeroVisible = ref(false);
const contentSentinel = ref<HTMLElement | null>(null);
let contentObserver: IntersectionObserver | null = null;
let scrollRevealRaf = 0;
let sectionSnapTimeout: ReturnType<typeof setTimeout> | null = null;
let isSectionSnapping = false;
const scrollIntentKeys = new Set(["ArrowDown", "PageDown", "End", " "]);
const snapSectionSelector = [
    ".citazione-section",
    ".spiegazione-section",
    ".demo-section",
    ".casi-section",
    ".hero",
    ".footer-section"
].join(",");

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
    revealDeferredContent();
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

    revealDeferredContent();
    await nextTick();

    document.querySelector(hash)?.scrollIntoView({ block: "start" });
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
    void loadCasiFromCms();
    void loadFooterFromCms();

    addScrollIntentListeners();

    if (window.matchMedia("(min-width: 901px)").matches) {
        document.documentElement.classList.add("home-scroll-snap");
        window.addEventListener("wheel", handleSectionWheel, { passive: false });
    }
    window.addEventListener("axatel-hero-visibility", handleParticleHeroVisibility);
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
    document.documentElement.classList.remove("home-scroll-snap");
    contentObserver?.disconnect();
    contentObserver = null;
    removeScrollIntentListeners();
    window.removeEventListener("wheel", handleSectionWheel);
    window.removeEventListener("axatel-hero-visibility", handleParticleHeroVisibility);
    window.removeEventListener("axatel-demo-jump", revealAndScrollToDemo);
    window.removeEventListener("scroll", revealOnIntent);
    window.removeEventListener("hashchange", revealAndScrollToHash);
    if (scrollRevealRaf) {
        cancelAnimationFrame(scrollRevealRaf);
        scrollRevealRaf = 0;
    }
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
        casesLogoAsset: "/immagini/angelo.png"
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
        [
        {
            "title": "Automazione e monitoraggio SS51 Alemagna",
            "client": "Provincia di Belluno · ANAS",
            "category": "Smart Road",
            "image": "/immagini/casi-di-successo/ss51-alemagna.webp",
            "description": "Sistema di monitoraggio e automazione installato lungo la SS51 Alemagna per aumentare la sicurezza della viabilità in un'area soggetta a frane e colate detritiche.",
            "tags": ["LoRaWAN", "Monitoraggio", "Automazione", "Smart Road"],
            "slug": "automazione-e-monitoraggio-in-ss51-alemagna-bl",
            "content": `<p>
                        Per garantire la <strong>sicurezza della SS51 Alemagna</strong>, una delle principali arterie di collegamento con Cortina d'Ampezzo, Axatel ha realizzato un sistema intelligente di <strong>monitoraggio delle colate detritiche</strong> nell'area della <strong>Croda Marcora</strong>, nel comune di <strong>San Vito di Cadore (BL)</strong>.
                        </p>

                        <p>
                        L'intervento ha previsto l'installazione di una rete di <strong>sensori IoT</strong> lungo i canaloni e nelle aree a valle maggiormente esposte al rischio idrogeologico, con l'obiettivo di rilevare tempestivamente qualsiasi movimento anomalo del terreno e attivare automaticamente le procedure di emergenza.
                        </p>

                        <h3>Protezione automatica della viabilità</h3>

                        <p>
                        Il sistema non si limita al monitoraggio, ma interviene in modo completamente automatico. Al superamento delle soglie di rischio configurate, vengono immediatamente attivati i dispositivi di sicurezza presenti lungo la viabilità:
                        </p>

                        <ul>
                            <li><strong>Semafori intelligenti</strong> che bloccano il traffico veicolare.</li>
                            <li><strong>Sirene di allarme</strong> per avvisare automobilisti, ciclisti e pedoni.</li>
                            <li><strong>Notifiche istantanee</strong> inviate agli enti responsabili della gestione dell'emergenza.</li>
                        </ul>

                        <p>
                        La protezione interessa sia la <strong>Strada Statale Alemagna</strong> sia la <strong>pista ciclabile adiacente</strong>, due infrastrutture particolarmente frequentate durante tutto l'anno e, soprattutto, nella stagione turistica.
                        </p>

                        <h3>Monitoraggio continuo in tempo reale</h3>

                        <p>
                        La piattaforma raccoglie dati in tempo reale attraverso una rete di sensori composta da:
                        </p>

                        <ul>
                            <li>Pluviometri per il monitoraggio delle precipitazioni.</li>
                            <li>Clinometri per rilevare eventuali variazioni di inclinazione del terreno.</li>
                            <li>Accelerometri per individuare vibrazioni e movimenti improvvisi.</li>
                        </ul>

                        <p>
                        Tutti i dati vengono centralizzati nella piattaforma Axatel, che consente agli operatori di visualizzare lo stato dell'impianto, consultare lo storico delle misurazioni e ricevere notifiche immediate in caso di criticità.
                        </p>

                        <h3>Un'infrastruttura progettata per prevenire</h3>

                        <p>
                        Oltre a garantire una risposta automatica durante gli eventi franosi, il sistema permette di costruire uno <strong>storico completo dei fenomeni</strong>, fornendo informazioni preziose per l'analisi dell'evoluzione del dissesto idrogeologico e per la pianificazione degli interventi futuri.
                        </p>

                        <p>
                        <strong>Prevenzione, monitoraggio continuo e automazione</strong> lavorano insieme per aumentare la sicurezza di cittadini, operatori e turisti, riducendo i tempi di intervento e contribuendo alla continuità della viabilità in uno dei tratti stradali più importanti delle Dolomiti.
                        </p>`
        },
        {
            "title": "Galleria Caltanissetta SS640",
            "client": "ANAS",
            "category": "Gallerie",
            "image": "/immagini/casi-di-successo/ss640.webp",
            "description": "Tecnologie di supervisione e controllo per la nuova galleria SS640, a supporto dell'apertura completa dell'infrastruttura.",
            "tags": ["Galleria", "SCADA", "Supervisione"],
            "slug": "galleria-caltanissetta-ss640-opera-completata",
            "content": `<p>
La <strong>Galleria Caltanissetta</strong>, lungo la <strong>Strada Statale 640 "Strada degli Scrittori"</strong>, rappresenta una delle infrastrutture più importanti per il collegamento tra <strong>Caltanissetta</strong> e <strong>Agrigento</strong>. Per garantire elevati standard di sicurezza e continuità operativa, Axatel ha partecipato alla realizzazione degli impianti tecnologici in collaborazione con <strong>Pagano S.p.A.</strong> per conto di <strong>ANAS</strong>.
</p>

<p>
L'intervento ha riguardato l'installazione e l'integrazione dei sistemi di <strong>automazione</strong>, <strong>monitoraggio</strong> e <strong>controllo della circolazione</strong>, contribuendo al completamento dell'opera e alla successiva apertura al traffico dell'intera infrastruttura.
</p>

<h3>Sicurezza integrata della galleria</h3>

<p>
L'impianto è stato progettato per garantire la massima sicurezza degli utenti attraverso un insieme di sistemi intelligenti che operano in modo coordinato.
</p>

<ul>
    <li><strong>By-pass pedonali</strong> per l'evacuazione in caso di emergenza.</li>
    <li><strong>Sistemi di rilevazione incendio</strong> con monitoraggio continuo.</li>
    <li><strong>Segnaletica luminosa dinamica</strong> per la gestione della viabilità.</li>
    <li><strong>Videosorveglianza</strong> distribuita lungo tutta la galleria.</li>
    <li><strong>Stazioni SOS</strong> per le comunicazioni di emergenza.</li>
    <li><strong>Sensori ambientali</strong> per il monitoraggio della qualità dell'aria.</li>
</ul>

<h3>Monitoraggio e controllo in tempo reale</h3>

<p>
Tutti i dispositivi sono collegati a una piattaforma di supervisione che permette agli operatori di monitorare costantemente lo stato dell'infrastruttura, ricevere segnalazioni immediate in caso di anomalie e intervenire rapidamente per garantire la continuità del servizio.
</p>

<p>
La gestione centralizzata consente di controllare contemporaneamente gli impianti tecnologici, i sistemi di sicurezza e le condizioni ambientali della galleria, riducendo i tempi di intervento e aumentando l'affidabilità dell'intera infrastruttura.
</p>

<h3>Una galleria progettata per il futuro</h3>

<p>
Grazie all'integrazione di <strong>automazione, sensoristica IoT e supervisione avanzata</strong>, la Galleria Caltanissetta rappresenta un esempio di infrastruttura moderna, capace di offrire elevati standard di sicurezza e una gestione efficiente durante tutto il suo ciclo di vita.
</p>

<p>
L'intervento conferma l'esperienza di Axatel nello sviluppo di soluzioni tecnologiche dedicate alle <strong>Smart Road</strong>, contribuendo a rendere le infrastrutture stradali più sicure, intelligenti e affidabili.
</p>`
        },
        {
            "title": "Certificazione ESG",
            "client": "Axatel",
            "category": "Corporate",
            "image": "/immagini/casi-di-successo/esg.webp",
            "description": "Raggiungimento della certificazione ESG con livello C, confermando l'impegno dell'azienda verso sostenibilità, governance e responsabilità sociale.",
            "tags": ["ESG", "Sostenibilità"],
            "slug": "certificazione-esg",
            "content": `<p>
La sostenibilità rappresenta un valore fondamentale per la crescita di Axatel. Per questo motivo l'azienda ha intrapreso un percorso volto a integrare i principi <strong>ESG (Environmental, Social & Governance)</strong> all'interno delle proprie attività, ottenendo la certificazione con il livello <strong>"C - Satisfactory Level of Sustainability"</strong>.
</p>

<p>
Questo riconoscimento testimonia l'impegno concreto verso una gestione responsabile dell'azienda, orientata non solo all'innovazione tecnologica, ma anche alla tutela dell'ambiente, al benessere delle persone e a una governance trasparente.
</p>

<h3>Un impegno concreto verso la sostenibilità</h3>

<p>
Il percorso ESG di Axatel si basa su una strategia che coinvolge tutti gli aspetti dell'organizzazione, con l'obiettivo di creare valore nel lungo periodo per clienti, collaboratori, partner e territorio.
</p>

<ul>
    <li><strong>Riduzione dell'impatto ambientale</strong> attraverso processi più efficienti e tecnologie sostenibili.</li>
    <li><strong>Valorizzazione delle persone</strong>, promuovendo inclusione, sicurezza e crescita professionale.</li>
    <li><strong>Governance trasparente</strong> fondata su etica, responsabilità e rispetto delle normative.</li>
    <li><strong>Innovazione sostenibile</strong> nello sviluppo di soluzioni IoT e Smart Infrastructure.</li>
</ul>

<h3>La tecnologia al servizio dell'ambiente</h3>

<p>
Le soluzioni sviluppate da Axatel contribuiscono ogni giorno a rendere infrastrutture, città e territori più sicuri ed efficienti. Attraverso sistemi di <strong>monitoraggio intelligente</strong>, sensoristica IoT e piattaforme di supervisione, è possibile ridurre gli sprechi, ottimizzare le risorse e intervenire tempestivamente in caso di criticità.
</p>

<p>
L'innovazione tecnologica diventa così uno strumento concreto per favorire uno sviluppo più sostenibile, migliorando la qualità dei servizi e contribuendo alla tutela dell'ambiente.
</p>

<h3>Guardare al futuro con responsabilità</h3>

<p>
La certificazione ESG rappresenta un importante traguardo, ma soprattutto un punto di partenza. Axatel continuerà a investire in ricerca, innovazione e sostenibilità per sviluppare soluzioni sempre più affidabili, intelligenti e rispettose dell'ambiente, contribuendo alla costruzione di infrastrutture moderne e di un futuro più sostenibile.
</p>

<p>
<strong>Innovazione, responsabilità e sostenibilità</strong> sono i principi che guidano ogni progetto Axatel e che continuano a creare valore per clienti, comunità e territorio.
</p>`
        },
        {
            "title": "Galleria Caltanissetta SS640 - Apertura canna sinistra",
            "client": "ANAS",
            "category": "Gallerie",
            "image": "/immagini/casi-di-successo/ss640.webp",
            "description": "Supporto tecnologico per l'apertura della canna sinistra della galleria SS640 attraverso sistemi di monitoraggio e supervisione.",
            "tags": ["Galleria", "Monitoraggio", "Smart Road"],
            "slug": "galleria-caltanissetta-ss640-apertura-canna-sinistra",
            "content": `<p>
L'apertura della <strong>canna sinistra della Galleria Caltanissetta SS640</strong> ha rappresentato una fase importante nel percorso di completamento dell'infrastruttura. Axatel ha supportato il progetto contribuendo all'integrazione dei sistemi tecnologici necessari alla supervisione e alla gestione in sicurezza della tratta.
</p>

<p>
L'intervento ha richiesto il coordinamento di dispositivi di monitoraggio, automazione e controllo pensati per garantire continuità operativa e risposte rapide in caso di anomalie o condizioni critiche.
</p>

<h3>Supporto all'apertura al traffico</h3>

<p>
La messa in esercizio della canna sinistra ha beneficiato di una piattaforma di controllo capace di centralizzare le informazioni provenienti dagli impianti e di supportare gli operatori nelle attività di supervisione quotidiana.
</p>

<ul>
    <li><strong>Supervisione degli impianti</strong> tecnologici della galleria.</li>
    <li><strong>Monitoraggio in tempo reale</strong> delle condizioni operative.</li>
    <li><strong>Gestione centralizzata</strong> degli allarmi e delle segnalazioni.</li>
    <li><strong>Supporto alla sicurezza</strong> per utenti e operatori.</li>
</ul>

<h3>Controllo e affidabilità</h3>

<p>
L'integrazione dei sistemi consente di verificare costantemente lo stato dell'infrastruttura, individuare tempestivamente eventuali criticità e coordinare gli interventi in modo più efficiente.
</p>

<p>
La disponibilità di dati aggiornati e centralizzati permette agli operatori di mantenere alto il livello di sicurezza e di ridurre i tempi di risposta durante le fasi di esercizio.
</p>

<h3>Infrastrutture più intelligenti</h3>

<p>
Il progetto conferma il ruolo delle tecnologie di monitoraggio e automazione nella gestione delle infrastrutture moderne. Axatel continua a contribuire allo sviluppo di soluzioni per strade e gallerie più sicure, connesse e affidabili.
</p>

<p>
<strong>Supervisione, automazione e sicurezza</strong> sono gli elementi che rendono la gestione della galleria più efficace e pronta a rispondere alle esigenze del traffico moderno.
</p>`
        },
        {
            "title": "Partnership TAV",
            "client": "TAV - Trans Audio Video",
            "category": "Partnership",
            "image": "/immagini/casi-di-successo/tav.webp",
            "description": "Collaborazione strategica con TAV per distribuire le soluzioni Axatel sul mercato nazionale.",
            "tags": ["Partner", "Distribuzione"],
            "slug": "tav-partner-ideale-per-la-distribuzione-delle-nostre-soluzioni",
            "content": `<p>
Per rendere le proprie soluzioni sempre più accessibili sul territorio nazionale, Axatel ha avviato una collaborazione strategica con <strong>TAV (Trans Audio Video)</strong>, uno dei principali distributori italiani nel settore dell'Information Technology.
</p>

<p>
Questa partnership nasce con l'obiettivo di ampliare la rete commerciale e offrire a system integrator, installatori e rivenditori un accesso diretto alle soluzioni Axatel dedicate al <strong>monitoraggio IoT</strong>, alle <strong>Smart Road</strong> e alle <strong>Smart City</strong>.
</p>

<h3>Una partnership strategica</h3>

<p>
Grazie all'esperienza e alla capillarità di TAV nel mercato italiano, le tecnologie Axatel possono raggiungere un numero sempre maggiore di professionisti e aziende, garantendo un supporto commerciale e tecnico qualificato durante tutte le fasi del progetto.
</p>

<ul>
    <li><strong>Distribuzione nazionale</strong> delle soluzioni Axatel.</li>
    <li><strong>Supporto tecnico e commerciale</strong> per partner e rivenditori.</li>
    <li><strong>Maggiore disponibilità dei prodotti</strong> sul territorio italiano.</li>
    <li><strong>Collaborazione continua</strong> per lo sviluppo di nuove opportunità di business.</li>
</ul>

<h3>Innovazione alla portata di tutti</h3>

<p>
La collaborazione con TAV permette di mettere a disposizione del mercato un ecosistema completo di tecnologie dedicate al monitoraggio intelligente delle infrastrutture, al controllo ambientale e all'automazione, semplificando l'accesso alle soluzioni Axatel e accelerandone l'adozione in nuovi progetti.
</p>

<p>
Grazie a questa sinergia, clienti e partner possono contare su una filiera affidabile, competenze specialistiche e un servizio efficiente, dalla consulenza iniziale fino all'implementazione delle soluzioni.
</p>

<h3>Un obiettivo comune</h3>

<p>
La partnership tra <strong>Axatel</strong> e <strong>TAV</strong> rappresenta un importante passo nella diffusione delle tecnologie IoT sul territorio nazionale, con l'obiettivo di offrire strumenti sempre più innovativi per il monitoraggio, la sicurezza e la gestione intelligente delle infrastrutture.
</p>

<p>
<strong>Innovazione, competenza e collaborazione</strong> sono i valori che guidano questa partnership, creando nuove opportunità per clienti, integratori e professionisti del settore.
</p>`
        },
        {
            "title": "Angel River",
            "client": "Pubbliche Amministrazioni",
            "category": "Monitoraggio Ambientale",
            "image": "/immagini/casi-di-successo/angel-river.webp",
            "description": "Sistema IoT per il monitoraggio dei livelli dei corsi d'acqua con notifiche e allarmi in tempo reale.",
            "tags": ["LoRaWAN", "Allerta", "Idrometria"],
            "slug": "angel-river-il-sistema-di-monitoraggio-dei-livelli-dei-corsi-dacqua",
            "content": `<p>
<strong>Angel River</strong> è la soluzione sviluppata da Axatel per il <strong>monitoraggio intelligente dei livelli di fiumi, torrenti e bacini idrici</strong>. Progettato per supportare enti pubblici, concessionarie stradali e gestori delle infrastrutture, il sistema consente di rilevare in tempo reale le variazioni del livello dell'acqua e prevedere l'evoluzione degli eventi di piena, contribuendo alla protezione del territorio e delle persone.
</p>

<p>
Basato su tecnologia <strong>radar contactless</strong>, Angel River monitora costantemente il comportamento dei corsi d'acqua senza entrare in contatto con l'acqua stessa, garantendo misurazioni affidabili anche durante eventi meteorologici estremi.
</p>

<h3>Monitoraggio continuo dei corsi d'acqua</h3>

<p>
La piattaforma acquisisce e analizza in tempo reale i dati provenienti dai sensori installati lungo l'asta fluviale, permettendo di individuare tempestivamente condizioni di rischio e fornendo agli operatori un quadro completo della situazione.
</p>

<ul>
    <li><strong>Misurazione continua</strong> del livello dei corsi d'acqua.</li>
    <li><strong>Tecnologia radar</strong> ad alta affidabilità e senza contatto.</li>
    <li><strong>Monitoraggio dei flussi</strong> per stimare l'evoluzione delle piene.</li>
    <li><strong>Raccolta dei parametri ambientali</strong> per analisi e prevenzione.</li>
</ul>

<h3>Allerta automatica e protezione del territorio</h3>

<p>
Quando vengono superate le soglie di sicurezza configurate, il sistema genera automaticamente gli allarmi previsti, inviando notifiche immediate agli enti competenti e attivando, ove installati, dispositivi di segnalazione acustica e visiva per avvisare la popolazione.
</p>

<p>
La piattaforma permette inoltre di personalizzare le soglie di intervento e le modalità di notifica in base alle caratteristiche del territorio e alle esigenze operative dell'ente gestore.
</p>

<h3>Prevenzione attraverso i dati</h3>

<p>
Oltre alla gestione delle emergenze, Angel River costruisce uno <strong>storico completo delle misurazioni</strong>, consentendo di analizzare il comportamento dei corsi d'acqua nel tempo e supportando le decisioni relative alla manutenzione, alla pianificazione e alla mitigazione del rischio idrogeologico.
</p>

<p>
Grazie all'integrazione tra <strong>sensoristica IoT</strong>, <strong>monitoraggio in tempo reale</strong> e <strong>automazione degli allarmi</strong>, Angel River rappresenta una soluzione completa per aumentare la sicurezza del territorio e ridurre i tempi di risposta durante gli eventi di piena.
</p>`
        },
        {
            "title": "Geo Angel - Tre anni di operatività",
            "client": "ANAS",
            "category": "Monitoraggio Frane",
            "image": "/immagini/casi-di-successo/geo-angel-3anni.webp",
            "description": "Tre anni di funzionamento continuo del sistema Geo Angel per il monitoraggio di frane e dissesti lungo la rete stradale.",
            "tags": ["Frane", "LoRaWAN", "Geo Angel"],
            "slug": "3-anni-dallinstallazione-di-geo-angel",
            "content": `<p>
A tre anni dalla sua installazione, <strong>Geo Angel</strong> continua a dimostrare la propria affidabilità come sistema di <strong>monitoraggio e allerta per il rischio franoso</strong>. Progettato per garantire la sicurezza della viabilità in aree soggette a dissesto idrogeologico, il sistema opera ininterrottamente rilevando in tempo reale i movimenti del terreno e attivando automaticamente le procedure di emergenza.
</p>

<p>
La prima installazione è stata realizzata lungo la <strong>SS51 Alemagna, in località Fadalto</strong>, dove la tecnologia Axatel ha contribuito alla riapertura della viabilità anche nelle ore notturne, aumentando il livello di sicurezza per automobilisti e operatori.
</p>

<h3>Monitoraggio intelligente del territorio</h3>

<p>
Geo Angel utilizza una rete di sensori installati nelle aree a rischio per monitorare costantemente la stabilità del terreno e individuare tempestivamente eventuali movimenti anomali.
</p>

<ul>
    <li><strong>Rilevamento continuo</strong> dei movimenti franosi.</li>
    <li><strong>Attivazione automatica dei semafori</strong> per bloccare la circolazione in caso di pericolo.</li>
    <li><strong>Monitoraggio video</strong> tramite telecamere installate sulle aree controllate.</li>
    <li><strong>Gestione remota</strong> attraverso piattaforma web e applicazione mobile.</li>
</ul>

<h3>Allerta immediata e controllo remoto</h3>

<p>
Quando vengono superate le soglie di sicurezza configurate, il sistema genera automaticamente gli allarmi, inviando notifiche agli operatori e attivando i dispositivi di segnalazione presenti lungo la strada. La piattaforma consente inoltre di verificare in tempo reale lo stato dell'area monitorata grazie all'integrazione con il sistema di videosorveglianza.
</p>

<p>
Operatori e tecnici possono accedere in qualsiasi momento allo storico delle misurazioni, visualizzare lo stato dei sensori e gestire l'intero impianto da remoto tramite un'interfaccia intuitiva e sempre aggiornata.
</p>

<h3>Tre anni di affidabilità sul campo</h3>

<p>
Dalla sua messa in esercizio, <strong>Geo Angel ha operato senza generare falsi allarmi</strong>, confermando l'affidabilità della soluzione anche durante eventi meteorologici complessi. L'esperienza maturata sul campo dimostra come l'integrazione tra <strong>sensoristica IoT</strong>, <strong>automazione</strong> e <strong>monitoraggio in tempo reale</strong> rappresenti uno strumento fondamentale per la prevenzione del rischio idrogeologico.
</p>

<p>
Grazie a Geo Angel, Axatel continua a supportare enti pubblici e gestori delle infrastrutture nella protezione del territorio, contribuendo a rendere le strade più sicure e a ridurre i tempi di intervento durante le emergenze.
</p>`
        },
        {
            "title": "Nuove frane sul Fadalto",
            "client": "ANAS",
            "category": "Protezione Civile",
            "image": "/immagini/casi-di-successo/fadalto.webp",
            "description": "Il sistema Geo Angel rileva nuove colate detritiche e attiva automaticamente le procedure di sicurezza.",
            "tags": ["Frane", "Allarmi", "Automazione"],
            "slug": "nuove-frane-sul-fadalto-nuovo-record-per-geo-angel",
            "content": `<p>
Nel corso degli anni il tratto della <strong>SS51 Alemagna in località Fadalto</strong> è stato interessato da numerosi eventi franosi che hanno rappresentato un rischio concreto per la sicurezza della circolazione. Per affrontare questa criticità, Axatel ha sviluppato <strong>Geo Angel</strong>, una piattaforma intelligente in grado di monitorare costantemente le aree instabili e attivare automaticamente le misure di sicurezza quando vengono rilevate situazioni di pericolo.
</p>

<p>
Anche durante i più recenti eventi franosi, il sistema ha dimostrato ancora una volta la propria affidabilità, individuando tempestivamente i movimenti del terreno e contribuendo alla protezione di automobilisti e operatori. Questo risultato conferma l'efficacia di una tecnologia progettata per intervenire prima che il rischio si trasformi in emergenza.
</p>

<h3>Monitoraggio continuo del rischio</h3>

<p>
Geo Angel controlla costantemente le aree soggette a dissesto attraverso una rete di sensori installati nei punti più critici, raccogliendo dati in tempo reale e analizzando ogni variazione del terreno.
</p>

<ul>
    <li><strong>Monitoraggio H24</strong> delle aree a rischio franoso.</li>
    <li><strong>Rilevamento immediato</strong> di movimenti anomali del terreno.</li>
    <li><strong>Analisi continua</strong> dei dati provenienti dalla sensoristica IoT.</li>
    <li><strong>Storico degli eventi</strong> per supportare le attività di prevenzione e manutenzione.</li>
</ul>

<h3>Intervento automatico in caso di pericolo</h3>

<p>
Quando vengono superate le soglie di sicurezza configurate, la piattaforma attiva automaticamente le procedure di emergenza, bloccando il traffico mediante semafori intelligenti, inviando notifiche agli enti competenti e consentendo agli operatori di verificare immediatamente la situazione attraverso i sistemi di supervisione.
</p>

<p>
L'automazione riduce drasticamente i tempi di reazione e permette di intervenire prima che il fenomeno possa mettere a rischio la sicurezza delle persone o compromettere la viabilità.
</p>

<h3>Una tecnologia che continua a fare la differenza</h3>

<p>
Ogni nuovo evento rappresenta una conferma dell'affidabilità di Geo Angel. La capacità di rilevare con precisione i fenomeni franosi e di attivare automaticamente le misure di protezione rende il sistema uno strumento fondamentale per la gestione del rischio idrogeologico lungo infrastrutture strategiche.
</p>

<p>
Grazie all'integrazione tra <strong>sensoristica IoT</strong>, <strong>monitoraggio in tempo reale</strong> e <strong>automazione degli allarmi</strong>, Axatel continua a supportare enti pubblici e gestori delle infrastrutture nella salvaguardia del territorio, contribuendo a rendere le strade più sicure e resilienti.
</p>`
        },
        {
            "title": "Nuova sede Axatel Sud Italia",
            "client": "Axatel",
            "category": "Corporate",
            "image": "/immagini/casi-di-successo/sud-italia.webp",
            "description": "Apertura della nuova sede operativa dedicata ai clienti del Sud Italia per garantire un supporto ancora più vicino al territorio.",
            "tags": ["Azienda", "Espansione"],
            "slug": "nuova-apertura-di-axatel",
            "content": `<p>
Con l'apertura della nuova sede nel Sud Italia, Axatel compie un importante passo nel proprio percorso di crescita, rafforzando la presenza sul territorio nazionale e avvicinandosi ancora di più a clienti, partner e pubbliche amministrazioni.
</p>

<p>
La nuova sede nasce con l'obiettivo di offrire un supporto ancora più rapido e diretto nello sviluppo di soluzioni dedicate al <strong>monitoraggio IoT</strong>, alle <strong>Smart Road</strong>, alle <strong>Smart City</strong> e alla gestione intelligente delle infrastrutture, mettendo a disposizione competenze tecniche e servizi di assistenza sempre più vicini alle esigenze del territorio.
</p>

<h3>Una presenza sempre più capillare</h3>

<p>
L'espansione nel Sud Italia rappresenta un investimento strategico che consente ad Axatel di seguire con maggiore efficienza progetti distribuiti su tutto il territorio nazionale, garantendo tempi di risposta più rapidi e un supporto tecnico qualificato.
</p>

<ul>
    <li><strong>Maggiore vicinanza ai clienti</strong> e agli enti pubblici.</li>
    <li><strong>Supporto tecnico e commerciale</strong> direttamente sul territorio.</li>
    <li><strong>Riduzione dei tempi di intervento</strong> durante le fasi di installazione e assistenza.</li>
    <li><strong>Nuove opportunità di collaborazione</strong> con partner locali e system integrator.</li>
</ul>

<h3>Innovazione senza confini</h3>

<p>
La nuova sede permetterà di accelerare la diffusione delle tecnologie Axatel in nuove aree del Paese, favorendo lo sviluppo di progetti dedicati alla sicurezza delle infrastrutture, al monitoraggio ambientale e alla digitalizzazione dei servizi pubblici e privati.
</p>

<p>
L'esperienza maturata in anni di attività nel settore delle infrastrutture intelligenti viene così messa a disposizione di un numero sempre maggiore di realtà, contribuendo alla realizzazione di sistemi sempre più affidabili, connessi e orientati alla prevenzione.
</p>

<h3>Uno sguardo al futuro</h3>

<p>
L'apertura della sede nel Sud Italia non rappresenta soltanto un'espansione geografica, ma conferma la volontà di Axatel di continuare a investire in innovazione, ricerca e presenza sul territorio, costruendo relazioni solide con clienti e partner e sostenendo lo sviluppo di nuove infrastrutture intelligenti.
</p>

<p>
<strong>Crescita, innovazione e prossimità</strong> sono i valori che guidano questa nuova fase del percorso di Axatel, con l'obiettivo di offrire soluzioni sempre più efficaci per un futuro connesso e sicuro.
</p>`
        },
        {
            "title": "Geo Angel in azione",
            "client": "ANAS",
            "category": "Monitoraggio Frane",
            "image": "/immagini/casi-di-successo/geo-angel.webp",
            "description": "Il sistema Geo Angel interviene nuovamente durante un evento franoso, contribuendo alla sicurezza della viabilità.",
            "tags": ["Frane", "Monitoraggio", "Smart Road"],
            "slug": "geo-angel-il-sistema-di-axatel-di-nuovo-in-azione",
            "content": `<p>
La sicurezza della viabilità nelle aree soggette a rischio idrogeologico richiede sistemi in grado di intervenire in modo rapido e automatico. Con <strong>Geo Angel</strong>, Axatel ha sviluppato una piattaforma intelligente capace di rilevare in tempo reale i movimenti del terreno e attivare immediatamente le misure di protezione, riducendo il rischio per automobilisti e operatori.
</p>

<p>
Anche durante un recente evento franoso lungo la <strong>SS51 Alemagna</strong>, il sistema ha dimostrato ancora una volta la propria efficacia, rilevando il fenomeno e contribuendo alla gestione della viabilità attraverso l'attivazione automatica dei dispositivi di sicurezza installati sul territorio.
</p>

<h3>Monitoraggio continuo H24</h3>

<p>
Geo Angel utilizza una rete di sensori IoT installati nei punti più critici per controllare costantemente la stabilità dei versanti e individuare qualsiasi movimento anomalo prima che possa trasformarsi in un pericolo per la circolazione.
</p>

<ul>
    <li><strong>Controllo continuo</strong> delle aree a rischio franoso.</li>
    <li><strong>Rilevamento immediato</strong> di movimenti del terreno.</li>
    <li><strong>Analisi in tempo reale</strong> dei dati provenienti dai sensori.</li>
    <li><strong>Storico completo degli eventi</strong> per supportare analisi e manutenzione.</li>
</ul>

<h3>Allerta automatica e gestione della viabilità</h3>

<p>
Al superamento delle soglie configurate, la piattaforma genera automaticamente gli allarmi e attiva i dispositivi di segnalazione presenti lungo la strada, come semafori intelligenti, sirene e notifiche agli enti competenti. Questo permette di limitare immediatamente l'accesso alle aree interessate e ridurre drasticamente i tempi di intervento.
</p>

<p>
L'intero impianto è supervisionabile da remoto attraverso la piattaforma Axatel, consentendo agli operatori di verificare in tempo reale la situazione, consultare le immagini delle telecamere e coordinare rapidamente le operazioni di emergenza.
</p>

<h3>Tecnologia al servizio della prevenzione</h3>

<p>
Ogni nuovo evento conferma il valore di un approccio basato sulla prevenzione. Grazie all'integrazione tra <strong>sensoristica IoT</strong>, <strong>automazione</strong> e <strong>monitoraggio in tempo reale</strong>, Geo Angel rappresenta una soluzione affidabile per la protezione delle infrastrutture stradali e la salvaguardia delle persone.
</p>

<p>
L'esperienza maturata sul campo continua a dimostrare come la tecnologia possa trasformare il monitoraggio del territorio in uno strumento concreto di sicurezza, supportando enti pubblici e gestori delle infrastrutture nella gestione del rischio idrogeologico.
</p>`
        }
        ]        
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