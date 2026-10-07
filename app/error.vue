<template>
    <!-- Every error, in the site's own look, with the menu and footer.
         A missing page ("in preparation or moved") keeps the 404 status for
         search engines but tells visitors where to go instead of a bare error. -->
    <NuxtLayout>
        <main class="err-page">
            <header class="err-hero">
                <ArticleParticleHero :title="is404 ? t('notFound.title') : t('notFound.errorTitle')" :asset-url="headerWing()" />
            </header>

            <div class="err-stage">
                <section class="err-shell">
                    <div class="err-panel">
                        <div class="err-copy">
                            <p class="err-badge"><span class="err-dot" aria-hidden="true"></span>{{ is404 ? t("notFound.badge") : `${statusCode}` }}</p>
                            <h1>{{ is404 ? t("notFound.heading") : t("notFound.errorTitle") }}</h1>
                            <p class="err-text">{{ is404 ? t("notFound.text") : t("notFound.errorText") }}</p>
                            <div class="err-actions">
                                <button type="button" class="err-btn err-btn--primary" @click="go('/')">{{ t("notFound.home") }}</button>
                                <button v-if="!is404" type="button" class="err-btn" @click="retry">{{ t("notFound.retry") }}</button>
                                <button v-else type="button" class="err-btn" @click="go('/contatti')">{{ t("comingSoon.cta") }}</button>
                            </div>
                        </div>
                        <div class="err-code" aria-hidden="true">{{ statusCode }}</div>
                    </div>

                    <nav v-if="is404" class="err-links" :aria-label="t('notFound.title')">
                        <button v-for="link in links" :key="link.path" type="button" @click="go(link.path)">
                            <strong>{{ label(link.label) }}</strong>
                            <em aria-hidden="true">→</em>
                        </button>
                    </nav>
                </section>
            </div>
        </main>
    </NuxtLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { NuxtError } from "#app";
import ArticleParticleHero from "./components/articles/ArticleParticleHero.vue";
import { NAV_LABELS } from "./data/navLabels";

const props = defineProps<{ error: NuxtError }>();
const { t, locale } = useI18n();
const localePath = useLocalePath();

const statusCode = computed(() => Number(props.error?.statusCode) || 500);
const is404 = computed(() => statusCode.value === 404);

const links = [
    { label: "Cosa monitoriamo?", path: "/monitoraggio" },
    { label: "Prodotti", path: "/prodotti" },
    { label: "Casi di successo", path: "/casi" },
    { label: "News", path: "/news" },
];

function label(text: string): string {
    if (locale.value === "it") return text.replace(/\?$/, "");
    const entry = NAV_LABELS[text];
    return (entry && (entry as any)[locale.value]) || text;
}

// An error page stays until cleared: leave it through clearError.
function go(path: string): void {
    clearError({ redirect: localePath(path) });
}

function retry(): void {
    clearError({ redirect: useRoute().fullPath });
}

useSeoMeta({
    title: () => `${is404.value ? t("notFound.title") : t("notFound.errorTitle")} | Axatel`,
    robots: "noindex,follow",
});
</script>

<style scoped>
.err-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.err-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.err-hero::after {
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

.err-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.err-shell {
    max-width: 980px;
    margin: 0 auto;
    padding: 7vh 24px 8vh;
}

.err-panel {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 32px;
    padding: 36px 40px;
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background:
        radial-gradient(circle at 92% 50%, rgba(42, 111, 165, 0.12), transparent 45%),
        linear-gradient(180deg, #ffffff 0%, #f6f9fc 100%);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
}

.err-panel::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: #c52317;
}

.err-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 18px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(11, 53, 91, 0.9);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.err-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ea3f30;
}

.err-panel h1 {
    margin: 0;
    color: #0b355b;
    font-size: clamp(1.45rem, 2.4vw, 1.9rem);
    line-height: 1.15;
}

.err-text {
    max-width: 560px;
    margin: 14px 0 0;
    color: #274e72;
    font-size: 1.04rem;
    line-height: 1.6;
}

.err-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 26px;
}

.err-btn {
    min-height: 44px;
    padding: 0 20px;
    border: 1px solid rgba(11, 53, 91, 0.24);
    border-radius: 999px;
    background: #fff;
    color: #0b355b;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 700;
    cursor: pointer;
}

.err-btn:hover {
    border-color: #c52317;
}

.err-btn--primary {
    border-color: #c52317;
    background: #c52317;
    color: #fff;
}

.err-btn--primary:hover {
    background: #ea3f30;
}

.err-code {
    color: rgba(11, 53, 91, 0.12);
    font-size: clamp(4.5rem, 10vw, 7.5rem);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.04em;
}

.err-links {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 28px;
}

.err-links button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 72px;
    padding: 16px;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background: rgba(255, 255, 255, 0.8);
    color: #0b355b;
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform 0.2s ease, border-color 0.2s ease;
}

.err-links button:hover {
    transform: translateY(-3px);
    border-color: rgba(197, 35, 23, 0.48);
}

.err-links em {
    color: #c52317;
    font-style: normal;
    font-weight: 700;
}

.err-btn:focus-visible,
.err-links button:focus-visible {
    outline: 2px solid #c52317;
    outline-offset: 2px;
}

@media (max-width: 820px) {
    .err-links {
        grid-template-columns: repeat(2, 1fr);
    }

    .err-code {
        display: none;
    }

    .err-panel {
        grid-template-columns: 1fr;
        padding: 28px 22px;
    }
}
</style>
