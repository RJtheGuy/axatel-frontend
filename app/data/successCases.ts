// Adjust this relative path to match your actual folder layout.
// If this file is at app/data/successCases.ts and your images are at
// app/assets/immagini/casi-di-successo/, this is correct as written.
const caseImages = import.meta.glob(
    "../assets/immagini/casi-di-successo/*.webp",
    { eager: true, import: "default" }
) as Record<string, string>;

function caseImg(filename: string): string {
    const match = Object.entries(caseImages).find(([path]) => path.endsWith(filename));
    if (!match) {
        console.warn(`[successCases] image not found in assets: ${filename}`);
    }
    return match?.[1] ?? "";
}

export type SuccessCaseItem = {
    title: string;
    client: string;
    category: string;
    image: string;
    description: string;
    tags: string[];
    slug: string;
    content?: string[] | string;
};

export const successCases: SuccessCaseItem[] = [
    {
        title: "Automazione e monitoraggio SS51 Alemagna",
        client: "Provincia di Belluno · ANAS",
        category: "Smart Road",
        image: caseImg("ss51-alemagna.webp"),
        description: "Sistema di monitoraggio e automazione lungo la SS51 Alemagna per aumentare la sicurezza in un'area soggetta a frane e colate detritiche.",
        tags: ["LoRaWAN", "Monitoraggio", "Automazione"],
        slug: "automazione-e-monitoraggio-in-ss51-alemagna-bl"
    },
    {
        title: "Galleria Caltanissetta SS640",
        client: "ANAS",
        category: "Gallerie",
        image: caseImg("ss640.webp"),
        description: "Tecnologie di supervisione e controllo per la nuova galleria SS640, a supporto dell'apertura completa dell'infrastruttura.",
        tags: ["Galleria", "SCADA", "Supervisione"],
        slug: "galleria-caltanissetta-ss640-opera-completata"
    },
    {
        title: "Certificazione ESG",
        client: "Axatel",
        category: "Corporate",
        image: caseImg("esg.webp"),
        description: "Raggiungimento della certificazione ESG con livello C, confermando l'impegno dell'azienda verso sostenibilita, governance e responsabilita sociale.",
        tags: ["ESG", "Sostenibilita"],
        slug: "certificazione-esg"
    },
    {
        title: "Galleria Caltanissetta SS640 - Apertura canna sinistra",
        client: "ANAS",
        category: "Gallerie",
        image: caseImg("ss640.webp"),
        description: "Supporto tecnologico per l'apertura della canna sinistra della galleria SS640 attraverso sistemi di monitoraggio e supervisione.",
        tags: ["Galleria", "Monitoraggio", "Smart Road"],
        slug: "galleria-caltanissetta-ss640-apertura-canna-sinistra"
    },
    {
        title: "Partnership TAV",
        client: "TAV - Trans Audio Video",
        category: "Partnership",
        image: caseImg("tav.webp"),
        description: "Collaborazione strategica con TAV per distribuire le soluzioni Axatel sul mercato nazionale.",
        tags: ["Partner", "Distribuzione"],
        slug: "tav-partner-ideale-per-la-distribuzione-delle-nostre-soluzioni"
    },
    {
        title: "Angel River",
        client: "Pubbliche Amministrazioni",
        category: "Monitoraggio Ambientale",
        image: caseImg("angel-river.webp"),
        description: "Sistema IoT per il monitoraggio dei livelli dei corsi d'acqua con notifiche e allarmi in tempo reale.",
        tags: ["LoRaWAN", "Allerta", "Idrometria"],
        slug: "angel-river-il-sistema-di-monitoraggio-dei-livelli-dei-corsi-dacqua"
    },
    {
        title: "Geo Angel - Tre anni di operativita",
        client: "ANAS",
        category: "Monitoraggio Frane",
        image: caseImg("geo-angel-3anni.webp"),
        description: "Tre anni di funzionamento continuo del sistema Geo Angel per il monitoraggio di frane e dissesti lungo la rete stradale.",
        tags: ["Frane", "LoRaWAN", "Geo Angel"],
        slug: "3-anni-dallinstallazione-di-geo-angel"
    },
    {
        title: "Nuove frane sul Fadalto",
        client: "ANAS",
        category: "Protezione Civile",
        image: caseImg("fadalto.webp"),
        description: "Il sistema Geo Angel rileva nuove colate detritiche e attiva automaticamente le procedure di sicurezza.",
        tags: ["Frane", "Allarmi", "Automazione"],
        slug: "nuove-frane-sul-fadalto-nuovo-record-per-geo-angel"
    },
    {
        title: "Nuova sede Axatel Sud Italia",
        client: "Axatel",
        category: "Corporate",
        image: caseImg("sud-italia.webp"),
        description: "Apertura della nuova sede operativa dedicata ai clienti del Sud Italia per garantire un supporto ancora piu vicino al territorio.",
        tags: ["Azienda", "Espansione"],
        slug: "nuova-apertura-di-axatel"
    },
    {
        title: "Geo Angel in azione",
        client: "ANAS",
        category: "Monitoraggio Frane",
        image: caseImg("geo-angel.webp"),
        description: "Il sistema Geo Angel interviene nuovamente durante un evento franoso, contribuendo alla sicurezza della viabilita.",
        tags: ["Frane", "Monitoraggio", "Smart Road"],
        slug: "geo-angel-il-sistema-di-axatel-di-nuovo-in-azione"
    }
];