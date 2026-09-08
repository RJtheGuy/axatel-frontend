export type GlossaryTerm = {
    term: string;
    definition: string;
    aliases?: string[];
};

export const glossaryTerms: GlossaryTerm[] = [
    {
        term: "Accelerometro",
        definition: "Sensore che misura accelerazioni e vibrazioni. Nel monitoraggio strutturale aiuta a osservare come ponti, edifici e altre opere reagiscono a traffico, vento o eventi sismici."
    },
    {
        term: "Allarme",
        definition: "Segnalazione generata quando una misura o un evento richiede attenzione. Puo avvisare un operatore oppure attivare automaticamente una procedura."
    },
    {
        term: "API",
        definition: "Insieme di regole che permette a software diversi di scambiarsi dati e comandi in modo strutturato.",
        aliases: ["Application Programming Interface"]
    },
    {
        term: "Attuatore",
        definition: "Dispositivo che esegue un comando fisico, per esempio accendere una sirena, cambiare un semaforo o mostrare un messaggio su un pannello."
    },
    {
        term: "Automazione",
        definition: "Uso di logiche e dispositivi per eseguire operazioni senza intervento manuale continuo, seguendo regole e condizioni definite."
    },
    {
        term: "Cloud",
        definition: "Insieme di risorse informatiche accessibili tramite rete, usate per conservare dati ed eseguire applicazioni senza ospitarle necessariamente nella sede del cliente."
    },
    {
        term: "Control Room",
        definition: "Sala di controllo dalla quale gli operatori osservano impianti ed eventi, ricevono allarmi e coordinano gli interventi."
    },
    {
        term: "Dashboard",
        definition: "Schermata che riassume dati, indicatori e allarmi per offrire una lettura immediata dello stato di un sistema."
    },
    {
        term: "Data logger",
        definition: "Dispositivo che acquisisce e conserva nel tempo le misure prodotte da uno o piu sensori, anche quando la connessione non e disponibile."
    },
    {
        term: "Digital Twin",
        definition: "Rappresentazione digitale di un impianto o di un'infrastruttura, alimentata da dati reali per comprenderne stato e comportamento.",
        aliases: ["Gemello digitale"]
    },
    {
        term: "Edge computing",
        definition: "Elaborazione dei dati vicino al punto in cui vengono prodotti. Riduce tempi di risposta e quantita di informazioni da inviare al sistema centrale."
    },
    {
        term: "Fail-safe",
        definition: "Principio di progettazione per cui, in caso di guasto, il sistema passa automaticamente alla condizione considerata piu sicura."
    },
    {
        term: "Firmware",
        definition: "Software installato direttamente in un dispositivo elettronico. Controlla sensori, consumi, memoria, comunicazioni e comportamento operativo."
    },
    {
        term: "Fessurimetro",
        definition: "Sensore che misura l'apertura e l'evoluzione di una fessura in una struttura."
    },
    {
        term: "Gateway",
        definition: "Apparato che collega dispositivi o reti differenti. In una rete LoRaWAN riceve i messaggi radio dei sensori e li inoltra al network server."
    },
    {
        term: "Georeferenziazione",
        definition: "Associazione di un dato o di un oggetto a una posizione geografica precisa, così da rappresentarlo e consultarlo su una mappa."
    },
    {
        term: "Inclinometro",
        definition: "Sensore che misura variazioni di inclinazione. Viene usato per seguire movimenti e deformazioni di strutture o terreni."
    },
    {
        term: "Interoperabilita",
        definition: "Capacita di sistemi diversi di comunicare, scambiarsi informazioni e lavorare insieme senza perdere il significato dei dati."
    },
    {
        term: "IoT",
        definition: "Internet of Things: rete di oggetti fisici dotati di sensori, software e connettivita, capaci di raccogliere dati e comunicare con altri sistemi.",
        aliases: ["Internet of Things", "Internet delle cose"]
    },
    {
        term: "KPI",
        definition: "Indicatore sintetico usato per misurare prestazioni, risultati o andamento di un processo rispetto a un obiettivo.",
        aliases: ["Key Performance Indicator"]
    },
    {
        term: "LoRaWAN",
        definition: "Protocollo radio a lungo raggio e basso consumo pensato per collegare molti sensori. Copre aree estese, richiede poca energia e non necessita di una SIM per ogni dispositivo.",
        aliases: ["Long Range Wide Area Network", "LoRa"]
    },
    {
        term: "LPWAN",
        definition: "Famiglia di reti wireless progettate per trasmettere piccole quantita di dati su lunghe distanze consumando poca energia. LoRaWAN ne e un esempio.",
        aliases: ["Low Power Wide Area Network"]
    },
    {
        term: "Middleware",
        definition: "Software intermedio che riceve dati da dispositivi o applicazioni, li normalizza e li rende disponibili agli altri componenti del sistema."
    },
    {
        term: "Network server",
        definition: "Componente centrale di una rete LoRaWAN che gestisce dispositivi, sicurezza e messaggi ricevuti dai gateway."
    },
    {
        term: "Particolato",
        definition: "Insieme di particelle solide e liquide sospese nell'aria. Le sigle PM10 e PM2.5 indicano particelle con dimensioni differenti."
    },
    {
        term: "PLC",
        definition: "Controllore industriale programmabile che legge segnali dal campo ed esegue in modo affidabile logiche, sequenze e comandi sugli impianti.",
        aliases: ["Programmable Logic Controller"]
    },
    {
        term: "Protocollo",
        definition: "Insieme condiviso di regole e formati che consente a dispositivi e software di comunicare correttamente."
    },
    {
        term: "Real-time",
        definition: "Modalita in cui dati ed eventi vengono acquisiti, elaborati e resi disponibili con un ritardo sufficientemente breve per intervenire subito.",
        aliases: ["Tempo reale"]
    },
    {
        term: "SCADA",
        definition: "Sistema software per supervisionare e controllare impianti. Visualizza sinottici, misure e allarmi e permette agli operatori autorizzati di inviare comandi.",
        aliases: ["Supervisory Control and Data Acquisition"]
    },
    {
        term: "Sensore",
        definition: "Dispositivo che rileva una grandezza fisica o ambientale, come temperatura, livello, inclinazione o concentrazione di un inquinante, e la trasforma in un dato."
    },
    {
        term: "Sinottico",
        definition: "Rappresentazione grafica semplificata di un impianto che mostra collegamenti, stati, misure e comandi in una sola schermata."
    },
    {
        term: "Soglia",
        definition: "Valore configurato oltre il quale una misura cambia livello di attenzione o genera una segnalazione."
    },
    {
        term: "Telemetria",
        definition: "Raccolta e trasmissione a distanza delle misure prodotte da sensori, macchine o impianti."
    },
    {
        term: "Videoanalisi",
        definition: "Elaborazione automatica delle immagini di una telecamera per riconoscere oggetti, comportamenti o eventi, come code e veicoli fermi."
    }
];