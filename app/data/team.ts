import { resolveImage } from "../utils/resolveImage";

export type TeamMember = {
    id: string;
    name: string;
    image: string;
    description: string;
    position: { x: number; y: number };
};

export const teamMembers: TeamMember[] = [
    { id: "prima", name: "Prima Persona", image: resolveImage("/immagini/casi-di-successo/ss51-alemagna.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cura idee, relazioni e nuovi percorsi.", position: { x: 12, y: 34 } },
    { id: "seconda", name: "Seconda Persona", image: resolveImage("/immagini/casi-di-successo/fadalto.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Trasforma esigenze complesse in soluzioni concrete.", position: { x: 29, y: 45 } },
    { id: "terza", name: "Terza Persona", image: resolveImage("/immagini/casi-di-successo/geo-angel.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Collega dati, persone e infrastrutture.", position: { x: 47, y: 31 } },
    { id: "quarta", name: "Quarta Persona", image: resolveImage("/immagini/casi-di-successo/angel-river.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Osserva i dettagli e progetta sistemi affidabili.", position: { x: 68, y: 43 } },
    { id: "quinta", name: "Quinta Persona", image: resolveImage("/immagini/casi-di-successo/tav.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Accompagna i progetti dalla carta al campo.", position: { x: 87, y: 32 } },
    { id: "sesta", name: "Sesta Persona", image: resolveImage("/immagini/casi-di-successo/sud-italia.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Costruisce strumenti semplici per problemi reali.", position: { x: 18, y: 69 } },
    { id: "settima", name: "Settima Persona", image: resolveImage("/immagini/casi-di-successo/ss640.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tiene insieme tecnologia e operativita quotidiana.", position: { x: 37, y: 76 } },
    { id: "ottava", name: "Ottava Persona", image: resolveImage("/immagini/casi-di-successo/geo-angel-3anni.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cerca connessioni nuove tra competenze diverse.", position: { x: 58, y: 68 } },
    { id: "nona", name: "Nona Persona", image: resolveImage("/immagini/casi-di-successo/esg.webp"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Misura l'impatto e rende visibili i risultati.", position: { x: 79, y: 74 } },
    { id: "decima", name: "Decima Persona", image: resolveImage("/immagini/TrafficAlert.png"), description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Porta energia, metodo e curiosita nel gruppo.", position: { x: 91, y: 59 } }
];