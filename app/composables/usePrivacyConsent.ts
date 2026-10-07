/**
 * The privacy notice the forms link to (Impostazioni → Footer → Pagine
 * legali, sent by /api/v2/site-settings/ only when published), and the
 * sentence the visitor accepts — stored with each request as proof of
 * consent (GDPR).
 */
import { computed } from "vue";

export function usePrivacyConsent() {
    const { settings } = useSiteSettings();
    const { t } = useI18n();
    const localePath = useLocalePath();

    const path = computed(
        () => (settings.value?.footer as any)?.legal?.find((l: any) => l.kind === "privacy")?.url || "/privacy-policy/"
    );
    const href = computed(() => localePath(path.value.replace(/\/+$/, "") || "/"));
    const text = computed(() => `${t("consent.before")}${t("consent.link")}${t("consent.after")} (${path.value})`);
    return { href, text };
}
