export interface NavigationLink {
    label: string;
    href: string;
}

export interface NavigationGroup {
    label: string;
    links: NavigationLink[];
}

export interface NavigationItem {
    label: string;
    href?: string;
    groups?: NavigationGroup[];
}