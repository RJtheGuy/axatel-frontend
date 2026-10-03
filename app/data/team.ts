import { resolveImage } from "../utils/resolveImage";

export type TeamMember = {
    id: string;
    name: string;
    role?: string;
    image: string;
    description: string;
    position: { x: number; y: number };
    /** Organisation chart (CMS): who this person reports to, and the department they lead. */
    parentId?: string | null;
    department?: string;
};

/**
 * Where people sit on the team "network" (percent of the stage) when the
 * team comes from the CMS: spread evenly in one to three staggered rows,
 * depending on how many people there are.
 */
export function teamPosition(index: number, total: number): { x: number; y: number } {
    const rows = total <= 5 ? 1 : total <= 12 ? 2 : 3;
    const perRow = Math.ceil(total / rows);
    const row = Math.floor(index / perRow);
    const col = index % perRow;
    const inRow = Math.min(perRow, total - row * perRow);
    const ys = rows === 1 ? [52] : rows === 2 ? [34, 74] : [30, 54, 78];
    const x = ((col + 1) * 100) / (inRow + 1) + (row % 2 ? 3 : -3) * (inRow > 1 ? 1 : 0);
    const y = ys[row]! + (col % 2 ? 4 : -4) * (rows === 1 ? 1 : 0.5);
    return { x: Math.min(92, Math.max(8, x)), y };
}

/** Example team shown until real people are added in the CMS. */

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