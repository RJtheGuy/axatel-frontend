export interface NavigationLink {
    label: string;
    href: string;
    open_in_new_tab?: boolean;
}

export interface NavigationGroup {
    label: string;
    /** Impostazioni → Navigazione → Colonna: 1-3, or empty for automatic. */
    column?: number | null;
    links: NavigationLink[];
}

export interface NavigationItem {
    label: string;
    href?: string;
    groups?: NavigationGroup[];
}