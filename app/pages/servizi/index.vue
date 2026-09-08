<template>
    <main class="svc-page">
        <header class="svc-hero">
            <ArticleParticleHero title="Servizi" :asset-url="resolveImage('/immagini/ala.png')" />
        </header>

        <div class="svc-light-stage">
            <section class="svc-shell">
                <NuxtLink to="/" class="back-link">Torna alla home</NuxtLink>

                <div class="page-kicker">Come lo realizziamo</div>
                <p class="lead">{{ lead }}</p>

                <p v-if="!items.length" class="empty">
                    Nessun servizio pubblicato al momento.
                </p>

                <div v-else class="svc-grid">
                    <article v-for="item in items" :key="item.slug" class="svc-card">
                        <NuxtLink :to="`/servizi/${item.slug}`" class="svc-link" :aria-label="`Leggi ${item.title}`">
                            <div class="svc-icon" v-if="item.icon">{{ item.icon }}</div>
                            <h2>{{ item.title }}</h2>
                            <p>{{ item.description }}</p>
                        </NuxtLink>
                    </article>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useSeoMeta } from "#app";
import ArticleParticleHero from "../../components/articles/ArticleParticleHero.vue";

const { getPage, getPageBySlug } = useCms();

type ServiceItem = {
    title: string;
    icon: string;
    description: string;
    slug: string;
};

const { data: svcData } = await useAsyncData("servizi-list", () =>
    getPage("services.ServicePage", { order: "title" }).catch(() => null)
);

const { data: indexPage } = await useAsyncData("servizi-index", () =>
    getPageBySlug("services.ServicesIndexPage", "servizi").catch(() => null)
);

const DEFAULT_LEAD = "Piattaforme, sensori, tecnologie e servizi per realizzare monitoraggio e automazione su misura.";

const lead = computed(() => {
    const intro = indexPage.value?.intro;
    return typeof intro === "string" && intro.trim().length > 0 ? intro : DEFAULT_LEAD;
});

const items = computed<ServiceItem[]>(() =>
    (svcData.value?.items ?? []).map((p: any) => ({
        title: p.title,
        icon: p.icon || "",
        description: p.short_description || "",
        slug: p.meta?.slug
    }))
);

useSeoMeta({
    title: "Servizi | Axatel",
    description: () => lead.value,
    ogTitle: "Servizi | Axatel",
    ogDescription: () => lead.value,
    ogType: "website",
    robots: "index,follow"
});
</script>

<style scoped>
/* Same visual language as monitoraggio/index.vue, blog/index.vue, casi/index.vue. */
.svc-page {
    min-height: 100vh;
    overflow: hidden;
    background: var(--ax-color-bg-main);
}

.svc-hero {
    position: relative;
    z-index: 2;
    min-height: calc(var(--ax-navbar-height, 74px) + 200px);
    background: #020712;
}

.svc-hero::after {
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

.svc-light-stage {
    color: #0b355b;
    background:
        radial-gradient(circle at 12% 12%, rgba(197, 35, 23, 0.055), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(42, 111, 165, 0.07), transparent 30%),
        linear-gradient(180deg, #f7fafc 0%, #ffffff 38%, #f5f8fb 100%);
}

.svc-shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: 7vh 0 8vh;
}

.back-link {
    display: inline-block;
    margin-bottom: 18px;
    color: #c52317;
    text-decoration: none;
    font-weight: 700;
}

.page-kicker {
    padding-left: 14px;
    border-left: 4px solid #c52317;
    color: #c52317;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.lead {
    max-width: 720px;
    margin: 12px 0 28px;
    color: #274e72;
    font-size: 1.08rem;
    line-height: 1.62;
}

.empty {
    color: #667f97;
    padding: 40px 0;
}

.svc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 18px;
}

.svc-card {
    overflow: hidden;
    border: 1px solid rgba(11, 53, 91, 0.14);
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 14px 32px rgba(17, 48, 78, 0.08);
    transition: transform 0.22s ease, border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease;
}

.svc-link {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 26px;
    height: 100%;
    color: inherit;
    text-decoration: none;
}

.svc-icon {
    font-size: 2rem;
    line-height: 1;
}

.svc-link h2 {
    margin: 0;
    color: #0b355b;
    font-size: 1.14rem;
}

.svc-link p {
    margin: 0;
    color: #274e72;
    line-height: 1.5;
}

.svc-card:hover {
    transform: translateY(-5px);
    border-color: rgba(197, 35, 23, 0.48);
    background: #ffffff;
    box-shadow: 0 22px 44px rgba(17, 48, 78, 0.16);
}

@media (max-width: 768px) {
    .svc-hero {
        min-height: calc(var(--ax-navbar-height, 78px) + 28svh);
    }

    .svc-shell {
        padding: 5vh 5vw 6vh;
    }
}
</style>