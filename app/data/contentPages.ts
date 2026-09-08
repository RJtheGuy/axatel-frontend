import type { ContentPageData } from "../types/contentPage";
import { resolveImage } from "../utils/resolveImage";

type ContentArea = "soluzioni" | "approfondimenti" | "azienda";

const comingSoon = (
    slug: string,
    title: string,
    group: string,
    eyebrow: string,
    introduction: string
): ContentPageData => ({ slug, title, group, eyebrow, introduction, status: "coming-soon", sections: [] });

export const solutionPages: Record<string, ContentPageData> = {
    "angel-bpm": {
        slug: "angel-bpm",
        title: "Gestionale AngelBPM",
        group: "Piattaforme",
        eyebrow: "Supervisione e controllo",
        introduction: "Una piattaforma centrale raccoglie eventi, dati e procedure per trasformare sistemi diversi in un unico ambiente operativo.",
        status: "published",
        image: resolveImage("/immagini/Angel.png"),
        imageAlt: "Piattaforma di supervisione Angel",
        feature: {
            label: "La piattaforma",
            name: "Angel BPM Platform",
            description: "Il cuore software per gestire traffico, IoT, meteo, video e manutenzione con dati in tempo reale e processi guidati."
        },
        sections: [
            {
                title: "Una vista unica sull'infrastruttura",
                paragraphs: [
                    "AngelBPM riunisce dati provenienti da sensori, impianti, telecamere e sistemi di terze parti in dashboard, mappe e video wall configurabili.",
                    "Eventi e allarmi arrivano agli operatori con il contesto necessario per valutare la situazione e intervenire rapidamente."
                ],
                highlights: ["Eventi real-time", "Dashboard e video wall", "Integrazione sistemi"]
            },
            {
                title: "Dall'evento alla procedura",
                paragraphs: [
                    "La piattaforma associa agli eventi procedure operative, attività e responsabilità. Ogni passaggio rimane tracciato e alimenta report e indicatori.",
                    "La gestione della manutenzione completa il quadro con anagrafiche, scadenze e storico degli interventi."
                ]
            }
        ]
    },
    analitici: {
        slug: "analitici",
        title: "Analitici",
        group: "Piattaforme",
        eyebrow: "Dati e decisioni",
        introduction: "I dati raccolti sul campo diventano indicatori leggibili, confrontabili e utili a programmare le decisioni.",
        status: "published",
        sections: [
            {
                title: "Dal dato grezzo all'informazione",
                paragraphs: [
                    "Serie storiche, soglie, aggregazioni e correlazioni aiutano a riconoscere andamenti e anomalie senza perdere il dettaglio della singola misura.",
                    "Dashboard e report sono costruiti intorno al processo del gestore, non intorno alla tecnologia che produce il dato."
                ],
                highlights: ["Serie storiche", "KPI operativi", "Report configurabili"]
            },
            {
                title: "Condividere e integrare",
                paragraphs: [
                    "Le informazioni possono essere esportate o rese disponibili ad altri sistemi, enti e portali pubblici.",
                    "Permessi e viste dedicate consentono a ogni ruolo di accedere agli indicatori davvero rilevanti."
                ]
            }
        ]
    },
    sensori: {
        slug: "sensori",
        title: "Sensori",
        group: "Sensori",
        eyebrow: "Misure dal campo",
        introduction: "Scegliamo e integriamo sensori adatti al fenomeno da osservare, al luogo di installazione e alla continuita richiesta.",
        status: "published",
        image: resolveImage("/immagini/AngelBridge.png"),
        imageAlt: "Sensori per il monitoraggio strutturale",
        sections: [
            {
                title: "La misura giusta, nel punto giusto",
                paragraphs: [
                    "Parametri ambientali, strutturali, idraulici e di mobilita richiedono tecnologie, frequenze e soglie differenti.",
                    "Il progetto considera precisione, autonomia, robustezza, manutenzione e condizioni reali del sito."
                ],
                highlights: ["Ambientali", "Strutturali", "Mobilita"]
            },
            {
                title: "Una filiera completa",
                paragraphs: [
                    "Dal dispositivo alla piattaforma, seguiamo acquisizione, trasmissione, normalizzazione e rappresentazione del dato.",
                    "Il risultato e un sistema osservabile e manutenibile, pronto a generare allarmi e analisi."
                ]
            }
        ]
    },
    "telecamere-intelligenti": {
        slug: "telecamere-intelligenti",
        title: "Telecamere intelligenti",
        group: "Sensori",
        eyebrow: "Videoanalisi",
        introduction: "La telecamera diventa un sensore capace di riconoscere eventi e inviare informazioni operative in tempo reale.",
        status: "published",
        image: resolveImage("/immagini/TrafficAlert.png"),
        imageAlt: "Sistema Traffic Alert per la videoanalisi stradale",
        feature: {
            label: "Applicazione",
            name: "Traffic Alert",
            description: "Videoanalisi per rilevare incidenti, code, veicoli fermi e guida contromano, con verifica immediata dell'operatore."
        },
        sections: [
            {
                title: "Riconoscere gli eventi",
                paragraphs: [
                    "L'elaborazione a bordo riduce i tempi di risposta e limita il traffico dati, inviando al centro solo gli eventi e i flussi necessari.",
                    "Regole e aree di analisi vengono configurate in base allo scenario stradale e agli obiettivi del gestore."
                ],
                highlights: ["Analisi a bordo", "Allarmi real-time", "Verifica video"]
            },
            {
                title: "Integrare la risposta",
                paragraphs: [
                    "Gli allarmi possono raggiungere AngelBPM, SCADA e sistemi di automazione per attivare procedure, segnaletica e soccorsi.",
                    "Archivio e storico permettono di analizzare gli eventi e migliorare progressivamente le configurazioni."
                ]
            }
        ]
    },
    lorawan: {
        slug: "lorawan",
        title: "LoRaWAN",
        group: "Tecnologie",
        eyebrow: "Internet of Things",
        introduction: "Connettiamo sensori distribuiti con una rete radio a lungo raggio, bassi consumi e senza una SIM per ogni dispositivo.",
        status: "published",
        image: resolveImage("/immagini/AngelRiver.png"),
        imageAlt: "Dispositivi connessi tramite rete LoRaWAN",
        sections: [
            {
                title: "Connettivita per il territorio",
                paragraphs: [
                    "LoRaWAN e adatta a misure periodiche provenienti da molti punti, anche lontani dalla rete elettrica o dalla copertura cellulare.",
                    "Pochi gateway possono servire aree estese, riducendo costi ricorrenti e complessita sul campo."
                ],
                highlights: ["Lungo raggio", "Bassi consumi", "Nessuna SIM"]
            },
            {
                title: "Dal nodo al cloud",
                paragraphs: [
                    "Progettiamo dispositivi, copertura radio, gateway, network server e integrazione con le applicazioni finali.",
                    "Sicurezza, qualita del segnale e autonomia vengono verificate rispetto al contesto reale di installazione."
                ]
            }
        ]
    },
    networking: {
        slug: "networking",
        title: "Networking",
        group: "Tecnologie",
        eyebrow: "Reti affidabili",
        introduction: "Progettiamo reti che mantengono connessi impianti, sensori e centri di controllo anche negli ambienti infrastrutturali piu complessi.",
        status: "published",
        sections: [
            {
                title: "La rete come parte del sistema",
                paragraphs: [
                    "Fibra, radio, reti industriali e connettivita IP vengono dimensionate in base a distanze, banda, ridondanza e criticita operative.",
                    "Segmentazione e monitoraggio rendono l'infrastruttura piu controllabile e semplice da gestire."
                ],
                highlights: ["Fibra e radio", "Ridondanza", "Monitoraggio rete"]
            },
            {
                title: "Continuita operativa",
                paragraphs: [
                    "Architetture e apparati sono selezionati per lavorare nel contesto reale, dalla sala controllo agli armadi distribuiti lungo la rete.",
                    "Diagnostica e allarmi consentono di individuare rapidamente guasti e degradi della comunicazione."
                ]
            }
        ]
    },
    firmware: {
        slug: "firmware",
        title: "Firmware",
        group: "Tecnologie",
        eyebrow: "Sviluppo elettronico",
        introduction: "Sviluppiamo il software che governa dispositivi e schede elettroniche, dalla lettura dei sensori alla comunicazione con la piattaforma.",
        status: "published",
        sections: [
            {
                title: "Intelligenza sul dispositivo",
                paragraphs: [
                    "Il firmware gestisce acquisizione, consumi, diagnostica, memoria locale e protocolli di comunicazione.",
                    "La logica viene progettata insieme all'hardware per ottenere stabilita, autonomia e comportamento prevedibile sul campo."
                ],
                highlights: ["Acquisizione dati", "Energy management", "Diagnostica"]
            },
            {
                title: "Dal prototipo alla produzione",
                paragraphs: [
                    "Affianchiamo sviluppo, test e industrializzazione, anche per prodotti elettronici realizzati conto terzi.",
                    "Aggiornabilita e tracciabilita delle versioni rendono il ciclo di vita piu semplice da governare."
                ]
            }
        ]
    },
    scada: {
        slug: "scada",
        title: "SCADA",
        group: "Tecnologie",
        eyebrow: "Supervisione impianti",
        introduction: "Sistemi SCADA raccolgono stati, misure e allarmi e consentono agli operatori di comandare impianti distribuiti da un'unica interfaccia.",
        status: "published",
        sections: [
            {
                title: "Controllo in tempo reale",
                paragraphs: [
                    "Sinottici e dashboard mostrano lo stato degli apparati, evidenziano anomalie e supportano comandi controllati da remoto.",
                    "Allarmi, priorita e storico eventi danno all'operatore una lettura immediata di cio che richiede attenzione."
                ],
                highlights: ["Sinottici", "Allarmi", "Comandi remoti"]
            },
            {
                title: "Integrare nuovo ed esistente",
                paragraphs: [
                    "Colleghiamo PLC, sensori, sottosistemi e applicazioni di terze parti attraverso protocolli industriali e interfacce dedicate.",
                    "La soluzione viene adattata alle procedure operative e ai livelli di accesso dell'organizzazione."
                ]
            }
        ]
    },
    plc: {
        slug: "plc",
        title: "PLC",
        group: "Tecnologie",
        eyebrow: "Automazione industriale",
        introduction: "La logica PLC governa gli impianti sul campo con tempi certi, regole verificabili e continuita anche in assenza del centro di controllo.",
        status: "published",
        sections: [
            {
                title: "Automazioni affidabili",
                paragraphs: [
                    "Programmiamo sequenze, interblocchi, sicurezze e regolazioni per impianti stradali e infrastrutturali.",
                    "Ogni logica e costruita a partire dagli scenari operativi e dalle condizioni di guasto previste."
                ],
                highlights: ["Sequenze", "Interblocchi", "Fail-safe"]
            },
            {
                title: "Collaudo e manutenzione",
                paragraphs: [
                    "Test funzionali e messa in servizio verificano il comportamento dell'automazione prima e dopo l'installazione.",
                    "Diagnostica chiara e documentazione agevolano gli interventi durante l'intero ciclo di vita."
                ]
            }
        ]
    },
    progettazione: {
        slug: "progettazione",
        title: "Progettazione",
        group: "Servizi",
        eyebrow: "Ingegneria",
        introduction: "Traduciamo esigenze operative e vincoli normativi in sistemi integrati, dimensionati per funzionare e durare nel contesto reale.",
        status: "published",
        sections: [
            {
                title: "Dall'esigenza al progetto",
                paragraphs: [
                    "Analisi del sito, requisiti, architettura, computi e specifiche tecniche costruiscono una base chiara per la realizzazione.",
                    "Automazione, telecomunicazioni, sensoristica e software vengono considerati come parti dello stesso sistema."
                ],
                highlights: ["Analisi requisiti", "Progetto integrato", "Normative"]
            },
            {
                title: "Progettare per la gestione",
                paragraphs: [
                    "Le scelte tengono conto non solo dell'installazione, ma anche di manutenzione, evoluzione e continuita operativa.",
                    "Modelli e strumenti real-time aiutano a verificare scenari e prestazioni prima della messa in esercizio."
                ]
            }
        ]
    },
    "direzione-lavori": {
        slug: "direzione-lavori",
        title: "Direzione lavori",
        group: "Servizi",
        eyebrow: "Dalla carta al campo",
        introduction: "Seguiamo la realizzazione affinche impianti, software e infrastrutture rispettino progetto, tempi e qualita attesa.",
        status: "published",
        sections: [
            {
                title: "Coordinamento tecnico",
                paragraphs: [
                    "Verifichiamo avanzamento, materiali, lavorazioni e coerenza tra discipline, mantenendo allineati committente, imprese e fornitori.",
                    "Le decisioni di campo vengono tracciate e ricondotte agli obiettivi funzionali dell'opera."
                ],
                highlights: ["Controllo qualita", "Coordinamento", "Avanzamento lavori"]
            },
            {
                title: "Collaudo e consegna",
                paragraphs: [
                    "Prove, verifiche e documentazione accompagnano la messa in servizio del sistema.",
                    "La consegna include gli elementi necessari per gestire e mantenere l'infrastruttura nel tempo."
                ]
            }
        ]
    },
    "control-room": {
        slug: "control-room",
        title: "Control Room",
        group: "Servizi",
        eyebrow: "Supporto operativo",
        introduction: "Una control room remota affianca il personale locale nella supervisione degli impianti e nella gestione degli eventi.",
        status: "published",
        feature: {
            label: "Il servizio",
            name: "Twin Control Room",
            description: "Affiancamento remoto in tempo reale e disponibilita di una sala radio di backup per aumentare la continuita operativa."
        },
        sections: [
            {
                title: "Un secondo presidio",
                paragraphs: [
                    "Gli operatori Axatel seguono allarmi e situazioni operative insieme alla sala controllo del gestore, offrendo supporto tecnico e procedurale.",
                    "Il servizio puo diventare un punto di continuita quando la postazione principale non e disponibile."
                ],
                highlights: ["Affiancamento remoto", "Sala radio di backup", "Supporto real-time"]
            },
            {
                title: "Conoscenza condivisa",
                paragraphs: [
                    "L'osservazione quotidiana aiuta a individuare ricorrenze, affinare le procedure e migliorare la configurazione dei sistemi.",
                    "Report e tracciamento degli eventi mantengono trasparente il lavoro svolto."
                ]
            }
        ]
    }
};

export const insightPages: Record<string, ContentPageData> = {
    academy: comingSoon("academy", "Academy", "Risorse", "Formazione", "Stiamo preparando percorsi e contenuti formativi dedicati a monitoraggio, automazione e gestione delle infrastrutture."),
    news: comingSoon("news", "News", "Risorse", "Aggiornamenti", "Stiamo costruendo uno spazio per raccontare novita, progetti e appuntamenti dal mondo Axatel."),
    faq: comingSoon("faq", "FAQ", "Risorse", "Risposte utili", "Stiamo raccogliendo le domande piu frequenti su soluzioni, tecnologie, installazione e assistenza."),
    glossario: {
        slug: "glossario",
        title: "Glossario",
        group: "Risorse",
        eyebrow: "Parole e tecnologie",
        introduction: "Definizioni semplici dei termini tecnici usati nelle pagine Axatel, dalla sensoristica alle piattaforme di supervisione.",
        status: "published",
        sections: []
    }
};

export const companyPages: Record<string, ContentPageData> = {
    "chi-siamo": {
        slug: "chi-siamo",
        title: "Chi siamo",
        group: "Axatel",
        eyebrow: "Tecnologia e infrastrutture",
        introduction: "Dal 2012 progettiamo a Vicenza sistemi di automazione, monitoraggio e IoT per rendere infrastrutture e territori piu osservabili e sicuri.",
        status: "published",
        image: resolveImage("/immagini/angelo.png"),
        imageAlt: "Identita visiva Axatel",
        sections: [
            {
                title: "Un unico interlocutore",
                paragraphs: [
                    "Seguiamo l'intera filiera: sensori ed elettronica, comunicazione, automazione, software di supervisione e servizi operativi.",
                    "Questa visione riduce i passaggi tra fornitori e mantiene coerenti dati, impianti e procedure."
                ],
                highlights: ["Automazione", "IoT", "Software"]
            },
            {
                title: "Esperienza sul campo",
                paragraphs: [
                    "Lavoriamo in particolare su strade, gallerie, dissesto idrogeologico e monitoraggio ambientale e strutturale.",
                    "Partiamo dal problema operativo, scegliamo la tecnologia necessaria e accompagniamo il sistema durante il suo utilizzo."
                ]
            }
        ]
    },
    "bilancio-sostenibilita": {
        slug: "bilancio-sostenibilita",
        title: "Bilancio di sostenibilita",
        group: "Axatel",
        eyebrow: "Responsabilita e trasparenza",
        introduction: "Misuriamo il nostro impatto e rendiamo visibili impegni, risultati e obiettivi ambientali, sociali e di governance.",
        status: "published",
        image: resolveImage("/immagini/casi-di-successo/esg.webp"),
        imageAlt: "Percorso ESG e sostenibilita Axatel",
        sections: [
            {
                title: "Un percorso misurabile",
                paragraphs: [
                    "Il bilancio organizza dati e iniziative per leggere con chiarezza l'evoluzione dell'azienda oltre ai soli risultati economici.",
                    "Indicatori e obiettivi aiutano a trasformare gli impegni in azioni verificabili nel tempo."
                ],
                highlights: ["Ambiente", "Persone", "Governance"]
            },
            {
                title: "Tecnologia con uno scopo",
                paragraphs: [
                    "Le soluzioni Axatel contribuiscono a conoscere meglio infrastrutture e territorio, riducendo interventi inutili e anticipando le criticita.",
                    "Lo stesso approccio basato sui dati guida le scelte interne e il dialogo con clienti, partner e comunita."
                ]
            }
        ]
    },
    "invia-il-cv": {
        slug: "invia-il-cv",
        title: "Lavora con noi",
        group: "Axatel",
        eyebrow: "Invia il tuo CV",
        introduction: "Cerchiamo persone curiose di unire elettronica, software e ingegneria per risolvere problemi concreti sul territorio.",
        status: "published",
        sections: [
            {
                title: "Competenze che dialogano",
                paragraphs: [
                    "I nostri progetti richiedono collaborazione tra sviluppo software, automazione, elettronica, reti e progettazione.",
                    "Valutiamo esperienza e specializzazione, ma anche capacita di comprendere il sistema nel suo insieme."
                ],
                highlights: ["Software", "Automazione", "Ingegneria"]
            },
            {
                title: "Presentati",
                paragraphs: [
                    "Raccontaci cosa sai fare, quali problemi ti piace affrontare e in quale direzione vorresti crescere.",
                    "Puoi inviare la candidatura attraverso la pagina contatti: il messaggio arrivera direttamente ad Axatel."
                ]
            }
        ],
        cta: { text: "Vuoi costruire con noi sistemi che lavorano nel mondo reale?", label: "Invia il tuo CV", href: "/contatti" }
    },
    "diventa-partner": {
        slug: "diventa-partner",
        title: "Diventa Partner",
        group: "Axatel",
        eyebrow: "Collaborazioni",
        introduction: "Costruiamo partnership con chi porta competenze, tecnologie o presenza sul territorio e condivide un approccio concreto ai problemi.",
        status: "published",
        sections: [
            {
                title: "Soluzioni che si completano",
                paragraphs: [
                    "Integratori, produttori, progettisti e operatori possono unire la propria specializzazione alla filiera tecnologica Axatel.",
                    "La collaborazione parte da obiettivi chiari, ruoli definiti e valore riconoscibile per il cliente finale."
                ],
                highlights: ["Tecnologie", "Competenze", "Territorio"]
            },
            {
                title: "Crescere sui progetti",
                paragraphs: [
                    "Condividiamo conoscenza tecnica, opportunita e responsabilita per affrontare scenari che richiedono capacita complementari.",
                    "Il successo della partnership si misura sulla qualita del risultato e sulla continuita della relazione."
                ]
            }
        ],
        cta: { text: "Hai una tecnologia o un progetto che potrebbe incontrare le competenze Axatel?", label: "Parliamone", href: "/contatti" }
    }
};

export const contentAreas: Record<ContentArea, {
    label: string;
    basePath: string;
    notFoundMessage: string;
    pages: Record<string, ContentPageData>;
    order: string[];
}> = {
    soluzioni: {
        label: "Come lo realizziamo",
        basePath: "/soluzioni",
        notFoundMessage: "Soluzione non trovata",
        pages: solutionPages,
        order: ["angel-bpm", "analitici", "sensori", "telecamere-intelligenti", "lorawan", "networking", "firmware", "scada", "plc", "progettazione", "direzione-lavori", "control-room"]
    },
    approfondimenti: {
        label: "Approfondimenti",
        basePath: "/approfondimenti",
        notFoundMessage: "Approfondimento non trovato",
        pages: insightPages,
        order: ["academy", "news", "faq", "glossario"]
    },
    azienda: {
        label: "Azienda",
        basePath: "/azienda",
        notFoundMessage: "Pagina aziendale non trovata",
        pages: companyPages,
        order: ["chi-siamo", "bilancio-sostenibilita", "invia-il-cv", "diventa-partner"]
    }
};

export type ContentAreaKey = keyof typeof contentAreas;