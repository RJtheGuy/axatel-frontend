/**
 * The "📋 Meta" panel of Monitoraggio, Soluzioni, Servizi and the
 * informative pages (backend core/page_meta.py), read the same way
 * everywhere.
 *
 *  - "Immagine nella pagina": next to the introduction (default), large at
 *    the top like a success story, or not on the page (card only).
 *  - "Mostra titolo nella card": off when the picture already contains the
 *    title; a card without a picture always shows its title.
 */
export type CoverPosition = "side" | "top" | "hidden";

export function coverPosition(page: { cover_position?: string | null } | null | undefined): CoverPosition {
    const value = page?.cover_position;
    return value === "top" || value === "hidden" ? value : "side";
}

export function showCardTitle(page: { show_card_title?: boolean | null } | null | undefined, hasImage: boolean): boolean {
    return !hasImage || page?.show_card_title !== false;
}

export function pageTags(page: { tags?: unknown } | null | undefined): string[] {
    return Array.isArray(page?.tags) ? page!.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "") : [];
}
