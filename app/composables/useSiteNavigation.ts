/**
 * Menu items for the navbar and footer, in the visitor's language, with
 * every internal link pointing to the same page in that language
 * (/monitoraggio/traffico → /en/monitoraggio/traffico).
 *
 * Source: the CMS menu (Impostazioni → Navigazione) when it has items,
 * otherwise the built-in menu in data/navigation.json, whose labels are
 * translated with data/navLabels.ts.
 */
import { computed } from "vue";
import fallbackNavigationItems from "../data/navigation.json";
import { NAV_LABELS } from "../data/navLabels";

type Link = { label: string; href: string; open_in_new_tab?: boolean };
type Group = { label: string; links: Link[] };
type Item = { label: string; href?: string | null; groups?: Group[] };

export function useSiteNavigation() {
    const { settings } = useSiteSettings();
    const { locale } = useI18n();
    const localePath = useLocalePath();

    const isInternal = (href?: string | null) => !!href && href.startsWith("/") && !href.startsWith("//");
    const localize = (href: string) => (isInternal(href) ? localePath(href) : href);

    const fromCms = computed(() => {
        const items = settings.value?.navigation?.items;
        return Array.isArray(items) && items.length > 0;
    });

    const translate = (label: string) => {
        if (fromCms.value || locale.value === "it") return label; // CMS already sent the right language
        const entry = NAV_LABELS[label];
        return (entry && (entry as any)[locale.value]) || label;
    };

    const items = computed<Item[]>(() => {
        const source: Item[] = fromCms.value
            ? (settings.value!.navigation.items as Item[])
            : (fallbackNavigationItems as Item[]);
        return source.map((item) => ({
            label: translate(item.label),
            href: item.href ? localize(item.href) : item.href,
            groups: (item.groups ?? []).map((group) => ({
                label: translate(group.label),
                links: (group.links ?? []).map((link) => ({ ...link, label: translate(link.label), href: localize(link.href) })),
            })),
        }));
    });

    return { items, isInternal, localize };
}
