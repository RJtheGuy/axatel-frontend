<template>
    <footer class="footer-section site-footer" aria-labelledby="site-footer-title">
        <h2 id="site-footer-title" class="sr-only">{{ t("footer.about") }}</h2>

        <div class="footer-top">
            <div class="footer-brand">
                <NuxtLink :to="localePath('/')" class="footer-logo" :aria-label="t('nav.home')">
                    <img :src="brandLogo" width="140" height="33" alt="Axatel" class="brand-logo" loading="lazy" decoding="async">
                </NuxtLink>
                <p class="footer-tagline">{{ t("footer.tagline") }}</p>
                <NuxtLink :to="cta.url" class="ax-cta-outline footer-cta">{{ cta.label }}</NuxtLink>
            </div>

            <nav class="footer-nav" :aria-label="t('footer.sitemap')">
                <div v-for="column in columns" :key="column.label" class="footer-col">
                    <h3>{{ column.label }}</h3>
                    <ul>
                        <li v-for="link in column.links" :key="`${column.label}-${link.href}-${link.label}`">
                            <NuxtLink
                                v-if="isInternal(link.href)"
                                :to="link.href"
                            >{{ link.label }}</NuxtLink>
                            <a
                                v-else
                                :href="link.href"
                                target="_blank"
                                rel="noopener noreferrer"
                            >{{ link.label }}</a>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>

        <address class="footer-contacts">
            <a
                v-for="item in contacts"
                :key="item.title"
                class="footer-contact"
                :href="item.href"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener noreferrer' : undefined"
            >
                <span class="contact-title">{{ item.title }}</span>
                <span class="contact-value">{{ item.value }}</span>
            </a>
            <div v-if="socialLinks.length" class="footer-contact footer-social">
                <span class="contact-title">{{ t("footer.follow") }}</span>
                <span class="contact-value social-links">
                    <a
                        v-for="link in socialLinks"
                        :key="link.url"
                        :href="link.url"
                        target="_blank"
                        rel="noopener noreferrer"
                    >{{ link.label }}</a>
                </span>
            </div>
        </address>

        <div class="footer-legal">
            <p>© {{ year }} Axatel S.r.l.</p>
            <p v-if="vat">{{ vatLabel }} {{ vat }}</p>
            <p v-if="tax && tax !== vat">{{ taxLabel }} {{ tax }}</p>
            <p v-if="rea">REA {{ rea }}</p>
            <p v-for="link in legalLinks" :key="link.kind" class="footer-legal-link">
                <NuxtLink :to="link.to">{{ link.label }}</NuxtLink>
            </p>
        </div>
    </footer>
</template>

<script setup lang="ts">
/**
 * Site-wide footer, rendered by layouts/default.vue on every page
 * (the homepage places it itself, at the end of its snap sections).
 *
 * Content sources, in order of precedence:
 *   - CMS  → Impostazioni → Footer (contacts, P.IVA, C.F.)
 *            Impostazioni → Navigazione (link columns, header button)
 *   - Fallbacks below, so the footer is never empty or shows placeholders.
 *
 * Empty strings from the CMS count as "not set" (the old footer used ??,
 * so a blank P.IVA field in the CMS rendered "00000000000").
 */
import { computed } from "vue";
import axatelLogo from "~/assets/immagini/Axatel.svg";

// Logo uploaded in the CMS (Impostazioni → Logo e immagini del sito), else the built-in one.
const branding = useState<{ logo?: string } | null>("branding");
const brandLogo = computed(() => branding.value?.logo || axatelLogo);

type Link = { label: string; href: string; open_in_new_tab?: boolean };
type NavItem = { label: string; href?: string | null; groups?: Array<{ label: string; links: Link[] }> };
type Contact = { title: string; value: string; href: string; external?: boolean };

// Company registration data (Axatel S.r.l., Vicenza). Used only when the
// CMS footer fields are empty. Keep in sync with the Registro Imprese.
const COMPANY = {
    vat: "03741090249",
    rea: "VI-350021",
};

const { t, locale } = useI18n();
const localePath = useLocalePath();
const { items: navItems, localize } = useSiteNavigation();

const DEFAULT_CONTACTS = (): Contact[] => [
    { title: t("footer.call"), value: "+39 0444 963891", href: "tel:+390444963891" },
    { title: t("footer.write"), value: "info@axatel.it", href: "mailto:info@axatel.it" },
    {
        title: t("footer.visit"),
        value: "Viale del Mercato Nuovo, 75 · 36100 Vicenza (VI)",
        href: "https://www.google.com/maps/place/Viale+Mercato+Nuovo,+75,+36100+Vicenza+VI",
        external: true,
    },
];

// "Seguici": Impostazioni → Footer → Seguici (social). Built-in until set.
const DEFAULT_SOCIAL = [
    { network: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/company/axatel/" },
    { network: "facebook", label: "Facebook", url: "https://www.facebook.com/profile.php?id=61587985567497" },
];

// Contact titles typed in the CMS are Italian; show the translated
// standard title for the usual four when viewing in English/French.
const TITLE_KEYS: Record<string, string> = {
    chiamaci: "footer.call", scrivici: "footer.write", "vieni a trovarci": "footer.visit", seguici: "footer.follow",
};

const { settings } = useSiteSettings();

const filled = (value?: string | null) => (value && value.trim() ? value.trim() : "");


// One column per dropdown menu; plain top-level links are collected into
// a final "Scopri" column so nothing in the navbar is missing here.
const columns = computed(() => {
    const cols: Array<{ label: string; links: Link[] }> = [];
    const direct: Link[] = [];
    for (const item of navItems.value) {
        const links = (item.groups ?? []).flatMap((g) => g.links ?? []).filter((l) => l?.href);
        if (links.length) cols.push({ label: item.label.replace(/\?$/, ""), links });
        else if (item.href) direct.push({ label: item.label, href: item.href });
    }
    if (direct.length) cols.push({ label: t("footer.discover"), links: [...direct, { label: t("footer.contacts"), href: localize("/contatti") }] });
    return cols;
});

const socialLinks = computed(() => {
    const cms = (settings.value?.footer as any)?.social;
    return Array.isArray(cms) && cms.length > 0 ? cms : DEFAULT_SOCIAL;
});

// An old single "Seguici" contact is replaced by the social list above.
const isFollowEntry = (c: Contact) => TITLE_KEYS[(c.title || "").trim().toLowerCase()] === "footer.follow";

const contacts = computed<Contact[]>(() => {
    const cms = (settings.value?.footer?.contacts ?? []).filter((c: Contact) => !isFollowEntry(c));
    if (!(Array.isArray(cms) && cms.length > 0)) return DEFAULT_CONTACTS();
    if (locale.value === "it") return cms;
    return cms.map((c: Contact) => {
        const key = TITLE_KEYS[(c.title || "").trim().toLowerCase()];
        return key ? { ...c, title: t(key) } : c;
    });
});

// In English/French always use the translated label (the CMS labels are Italian).
const vatLabel = computed(() => (locale.value === "it" && filled(settings.value?.footer?.vat_label)) || t("footer.vat"));
const taxLabel = computed(() => (locale.value === "it" && filled(settings.value?.footer?.tax_label)) || t("footer.tax"));
const vat = computed(() => filled(settings.value?.footer?.vat_value) || COMPANY.vat);
const tax = computed(() => filled(settings.value?.footer?.tax_value));
// Privacy / Cookie policy, shown once published (Impostazioni → Footer → Pagine legali).
const legalLinks = computed(() =>
    (((settings.value?.footer as any)?.legal ?? []) as Array<{ kind: string; url: string }>).map((link) => ({
        kind: link.kind,
        label: t(`footer.${link.kind}`),
        to: localePath(link.url.replace(/\/+$/, "") || "/"),
    }))
);
const rea = COMPANY.rea;

const cta = computed(() => {
    const c = settings.value?.navigation?.cta;
    return { label: (!c?.label_is_fallback && filled(c?.label)) || t("nav.cta"), url: localize(filled(c?.url) || "/contatti") };
});

const year = new Date().getFullYear();

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");
</script>

<style scoped>
.site-footer {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 72px max(24px, 8vw) 36px;
    color: var(--ax-color-text-secondary);
    background: linear-gradient(180deg, #030b14 0%, #02070f 100%);
    border-top: 1px solid var(--ax-color-border-soft);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

.footer-top {
    display: grid;
    grid-template-columns: minmax(220px, 300px) 1fr;
    gap: 56px;
}

.footer-brand {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
}

.footer-logo img {
    display: block;
    width: 140px;
    height: auto;
}

.footer-tagline {
    margin: 0;
    max-width: 30ch;
    font-size: 0.92rem;
    line-height: 1.6;
    color: var(--ax-color-text-muted);
}

.footer-cta {
    margin-top: 4px;
}

.footer-nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
    gap: 32px 24px;
}

.footer-col h3 {
    margin: 0 0 14px;
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ax-color-text-primary);
}

.footer-col ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 9px;
}

.footer-col a {
    font-size: 0.88rem;
    line-height: 1.35;
    color: var(--ax-color-text-muted);
    text-decoration: none;
    transition: color 0.15s ease;
}

.footer-col a:hover,
.footer-col a:focus-visible {
    color: var(--ax-color-text-primary);
}

.footer-contacts {
    margin-top: 56px;
    padding-top: 28px;
    border-top: 1px solid rgba(147, 183, 218, 0.14);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    font-style: normal;
}

.footer-contact {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-decoration: none;
}

.contact-title {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ax-color-accent-red-soft);
}

.contact-value {
    font-size: 0.95rem;
    line-height: 1.4;
    color: var(--ax-color-text-primary);
}

.social-links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
}

.social-links a {
    color: inherit;
    text-decoration: none;
}

.social-links a:hover,
.social-links a:focus-visible {
    text-decoration: underline;
    text-underline-offset: 3px;
}

.footer-contact:hover .contact-value,
.footer-contact:focus-visible .contact-value {
    text-decoration: underline;
    text-underline-offset: 3px;
}

.footer-legal {
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 22px;
    font-size: 0.8rem;
    color: var(--ax-color-text-muted);
    font-variant-numeric: tabular-nums;
}

.footer-legal p {
    margin: 0;
}

.footer-legal-link a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
}

.footer-legal-link a:hover {
    color: var(--ax-color-text-primary);
}

.site-footer a:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft);
    outline-offset: 3px;
    border-radius: 2px;
}

@media (max-width: 900px) {
    .footer-top {
        grid-template-columns: 1fr;
        gap: 40px;
    }

    .footer-nav {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 480px) {
    .site-footer {
        padding: 56px 20px 28px;
    }

    .footer-nav {
        gap: 28px 18px;
    }

    .footer-contacts {
        grid-template-columns: 1fr;
        margin-top: 40px;
    }
}

/* A logo uploaded in the CMS may have another shape: keep its proportions. */
.brand-logo {
    object-fit: contain;
}
</style>
