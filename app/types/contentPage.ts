export type ContentPageStatus = "published" | "coming-soon";

export type ContentSectionData = {
    title: string;
    paragraphs: string[];
    highlights?: string[];
};

export type ContentFeatureData = {
    label: string;
    name: string;
    description: string;
    href?: string;
    hrefLabel?: string;
};

export type ContentPageData = {
    slug: string;
    title: string;
    group: string;
    eyebrow: string;
    introduction: string;
    status: ContentPageStatus;
    image?: string;
    imageAlt?: string;
    feature?: ContentFeatureData;
    sections: ContentSectionData[];
    cta?: {
        text: string;
        label: string;
        href: string;
    };
};

export type ContentPageSummary = Pick<ContentPageData, "slug" | "title" | "group">;