// "No such page" (404) or "CMS unavailable" (503)?
//
// CMS calls pass their errors on (composables/useCms.ts). A 404 from the
// CMS means the page does not exist; anything else (timeout, server down,
// 5xx) means the CMS could not answer, so the visitor gets a 503 "try again
// shortly" page instead of a false "page not found", and search engines
// know to come back rather than drop the page.

export function isCmsUnavailable(error: unknown): boolean {
    if (!error) return false;
    const e = error as any;
    const status = e.statusCode ?? e.status ?? e.response?.status ?? e.data?.statusCode;
    return status !== 404;
}

export function cmsPageError(error: unknown, notFoundMessage: string) {
    const unavailable = isCmsUnavailable(error);
    return createError({
        statusCode: unavailable ? 503 : 404,
        statusMessage: unavailable ? useNuxtApp().$i18n.t("errors.unavailable") : notFoundMessage,
        // In the browser the error page must take over the whole page.
        fatal: import.meta.client,
    });
}
