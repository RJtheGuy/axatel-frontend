<template>
    <main class="content-page">
        <header class="content-hero">
<ArticleParticleHero :title="page.title" :asset-url="resolveImage('/immagini/ala.png')" />        </header>

        <div class="content-light-stage">
            <section class="content-shell">
                <NuxtLink to="/" class="back-link">Torna alla home</NuxtLink>
                <div class="eyebrow">{{ breadcrumbLabel }} · {{ page.group }} · {{ page.eyebrow }}</div>
                <p class="lead">{{ page.introduction }}</p>

                <ContentComingSoon
                    v-if="page.status === 'coming-soon'"
                    :group="page.group"
                    :eyebrow="page.eyebrow"
                />

                <GlossarySearch v-else-if="glossaryTerms.length" :terms="glossaryTerms" />

                <template v-else>
                    <ContentMedia :title="page.title" :src="page.image" :alt="page.imageAlt" />

                    <section v-if="page.feature" class="feature-band" :aria-labelledby="`feature-${page.slug}`">
                        <p class="feature-label">{{ page.feature.label }}</p>
                        <h2 :id="`feature-${page.slug}`">{{ page.feature.name }}</h2>
                        <p>{{ page.feature.description }}</p>
                        <a
                            v-if="page.feature.href"
                            class="feature-link"
                            :href="page.feature.href"
                            target="_blank"
                            rel="noopener noreferrer"
                        >{{ page.feature.hrefLabel || "Approfondisci" }}</a>
                    </section>

                    <ContentSection
                        v-for="section in page.sections"
                        :key="section.title"
                        :section="section"
                    />

                    <footer class="content-cta">
                        <p>{{ page.cta?.text || "Vuoi capire quale soluzione e adatta al tuo progetto?" }}</p>
                        <NuxtLink :to="page.cta?.href || '/contatti'" class="ax-cta-outline">
                            {{ page.cta?.label || "Contattaci" }}
                        </NuxtLink>
                    </footer>
                </template>

                <nav v-if="relatedPages.length" class="topic-navigation" :aria-label="relatedLabel">
                    <NuxtLink
                        v-for="item in relatedPages"
                        :key="item.slug"
                        :to="`${basePath}/${item.slug}`"
                    >
                        <span>{{ item.group }}</span>
                        <strong>{{ shortTitle(item.title) }}</strong>
                    </NuxtLink>
                </nav>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import type { ContentPageData, ContentPageSummary } from "../../types/contentPage";
import type { GlossaryTerm } from "../../data/glossary";
import ContentComingSoon from "./ComingSoon.vue";
import ContentMedia from "./ContentMedia.vue";
import ContentSection from "./ContentSection.vue";
import GlossarySearch from "./GlossarySearch.vue";
import ArticleParticleHero from "../articles/ArticleParticleHero.vue";

withDefaults(defineProps<{
    page: ContentPageData;
    breadcrumbLabel: string;
    basePath: string;
    relatedPages?: ContentPageSummary[];
    relatedLabel?: string;
    glossaryTerms?: GlossaryTerm[];
}>(), {
    relatedPages: () => [],
    relatedLabel: "Pagine correlate",
    glossaryTerms: () => []
});

function shortTitle(title: string): string {
    return title.replace(/^Monitoraggio\s+/i, "");
}
</script>

<style scoped>
.content-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.content-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 150px);
    background: #020712;
}

.content-hero::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -6vh;
    left: 0;
    z-index: 2;
    height: 8vh;
    pointer-events: none;
    background: linear-gradient(180deg, #020712 0%, rgba(2, 7, 18, 0.76) 40%, rgba(2, 7, 18, 0) 100%);
}

.content-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.content-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 7vh 0 6vh;
}

.back-link,
.feature-link {
    display: inline-block;
    color: #c52317;
    text-decoration: none;
    font-weight: 700;
}

.back-link {
    margin-bottom: 18px;
}

.eyebrow,
.feature-label {
    color: #c52317;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.eyebrow {
    padding-left: 14px;
    border-left: 4px solid #c52317;
}

.lead {
    max-width: 760px;
    margin: 10px 0 24px;
    color: #274e72;
    font-size: 1.08rem;
    line-height: 1.62;
}

.feature-band {
    max-width: 760px;
    margin-top: 28px;
    padding: 24px 0;
    border-top: 1px solid rgba(11, 53, 91, 0.18);
    border-bottom: 1px solid rgba(11, 53, 91, 0.18);
}

.feature-band h2 {
    margin: 8px 0 0;
    color: #0b355b;
    font-size: clamp(1.3rem, 2vw, 1.7rem);
}

.feature-band > p:not(.feature-label) {
    margin: 10px 0 0;
    color: #274e72;
    line-height: 1.68;
}

.feature-link {
    margin-top: 16px;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.feature-link::after {
    content: " ↗";
}

.content-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    max-width: 760px;
    margin-top: 28px;
    padding: 28px 0;
    border-top: 1px solid rgba(11, 53, 91, 0.18);
}

.content-cta p {
    max-width: 540px;
    color: #0b355b;
    font-size: clamp(1.1rem, 1.8vw, 1.4rem);
    line-height: 1.4;
}

.content-cta :deep(.ax-cta-outline) {
    color: #0b355b;
    border-color: rgba(197, 35, 23, 0.55);
}

.topic-navigation {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 44px;
    padding-top: 28px;
    border-top: 1px solid rgba(11, 53, 91, 0.18);
}

.topic-navigation a {
    min-height: 104px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 6px;
    padding: 16px;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background: rgba(255, 255, 255, 0.72);
    color: #0b355b;
    text-decoration: none;
    transition: transform 0.2s ease, border-color 0.2s ease;
}

.topic-navigation a:hover {
    transform: translateY(-3px);
    border-color: rgba(197, 35, 23, 0.48);
}

.topic-navigation span {
    color: #667f97;
    font-size: 0.7rem;
    text-transform: uppercase;
}

@media (max-width: 820px) {
    .content-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .content-shell {
        padding: 5vh 5vw 4vh;
    }

    .content-cta {
        align-items: flex-start;
        flex-direction: column;
    }

    .topic-navigation {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 520px) {
    .topic-navigation {
        grid-template-columns: 1fr;
    }
}
</style>