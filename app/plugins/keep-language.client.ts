// Safety net for links written in the code as Italian paths ("/casi",
// "/contatti") that haven't been converted to localePath() yet: when a
// visitor browsing in English or French clicks one, keep them in their
// language (/casi → /en/casi) instead of dropping them back to Italian.
//
// The language switcher sets `ax-switching-language` just before it
// navigates, so choosing Italian on purpose is not undone.
export default defineNuxtPlugin(() => {
    const router = useRouter();
    const switching = useState<boolean>("ax-switching-language", () => false);
    const PREFIX = /^\/(en|fr)(\/|$)/;

    router.beforeEach((to, from) => {
        if (switching.value) {
            switching.value = false;
            return;
        }
        const fromLanguage = from.path.match(PREFIX)?.[1];
        if (!fromLanguage || PREFIX.test(to.path)) return;
        // Only page routes; leave API, media and file links alone.
        if (/^\/(api|media|documents|cms|django-admin|_nuxt|fonts)(\/|$)/.test(to.path)) return;
        return {
            path: `/${fromLanguage}${to.path === "/" ? "" : to.path}`,
            query: to.query,
            hash: to.hash,
            replace: true,
        };
    });
});
