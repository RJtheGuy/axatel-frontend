/**
 * Impostazioni → Link ai documenti.
 *
 * newTab: open PDFs/documents in a new browser tab (the site stays open).
 * withTarget(html): adds target="_blank" to the document links inside
 * CMS text, only when newTab is on; otherwise the HTML is returned as is.
 *
 * A document link is any address with /documents/<number>/ in it: that is
 * how Wagtail serves the files chosen with the "Documento" button.
 * Uses the same cached request as the navbar and footer: no extra fetch.
 */
const DOCUMENT_HREF = /\/documents\/\d+\//;

export function isDocumentHref(href?: string | null): boolean {
    return !!href && DOCUMENT_HREF.test(href);
}

export function useDocumentLinks() {
    const { settings } = useSiteSettings();
    const newTab = computed(() => settings.value?.documents?.open_in_new_tab === true);

    function withTarget(html?: string | null): string {
        if (!html || !newTab.value) return html ?? "";
        return html.replace(/<a\b([^>]*)>/gi, (tag, attrs: string) => {
            const href = attrs.match(/\shref="([^"]*)"/i)?.[1];
            if (!isDocumentHref(href) || /\starget=/i.test(attrs)) return tag;
            return `<a${attrs} target="_blank" rel="noopener">`;
        });
    }

    return { newTab, withTarget };
}
