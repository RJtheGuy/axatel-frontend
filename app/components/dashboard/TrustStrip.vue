<template>
    <section v-if="clients.length || certifications.length" class="trust-section" :aria-label="t('trust.clients')">
        <div v-if="clients.length" class="trust-row">
            <h2>{{ t("trust.clients") }}</h2>
            <ul>
                <li v-for="item in clients" :key="item.name">
                    <component
                        :is="item.url ? 'a' : 'span'"
                        :href="item.url || undefined"
                        :target="item.url ? '_blank' : undefined"
                        :rel="item.url ? 'noopener noreferrer' : undefined"
                        class="logo"
                    >
                        <ContentResponsiveImage v-if="item.logo" :src="item.logo.url" :alt="item.logo.alt || item.name" :width="150" :height="44" sizes="150px" />
                        <span v-else>{{ item.name }}</span>
                    </component>
                </li>
            </ul>
        </div>

        <div v-if="certifications.length" class="trust-row">
            <h2>{{ t("trust.certifications") }}</h2>
            <ul>
                <li v-for="item in certifications" :key="item.name">
                    <component
                        :is="item.url ? 'a' : 'span'"
                        :href="item.url || undefined"
                        :target="item.url ? '_blank' : undefined"
                        :rel="item.url ? 'noopener noreferrer' : undefined"
                        class="logo cert"
                    >
                        <ContentResponsiveImage v-if="item.logo" :src="item.logo.url" :alt="item.logo.alt || item.name" :width="90" :height="52" sizes="90px" />
                        <span>{{ item.name }}</span>
                    </component>
                </li>
            </ul>
        </div>
    </section>
</template>

<script setup lang="ts">
/**
 * Homepage trust strip: client/partner logos and certifications.
 * Content: CMS → Home → "Fiducia" panel. Nothing is shown while both
 * lists are empty, so no placeholder or invented logos ever appear.
 */
import { onMounted, ref } from "vue";

type Logo = { name: string; url: string; logo: { url: string; alt?: string } | null };

const { t } = useI18n();
const { getPage } = useCms();

const clients = ref<Logo[]>([]);
const certifications = ref<Logo[]>([]);

const values = (stream: any): Logo[] =>
    (Array.isArray(stream) ? stream : []).map((b: any) => b?.value).filter((v: Logo) => v?.name);

onMounted(async () => {
    try {
        const res = await getPage<any>("home.HomePage", { limit: 1 });
        const home = res?.items?.[0];
        clients.value = values(home?.trust_clients);
        certifications.value = values(home?.trust_certifications);
    } catch {
        // CMS unreachable: the strip simply stays hidden.
    }
});
</script>

<style scoped>
.trust-section {
    position: relative;
    z-index: 2;
    display: grid;
    gap: 40px;
    padding: 64px max(24px, 8vw);
    background: #030b14;
    border-top: 1px solid var(--ax-color-border-soft);
}

.trust-row h2 {
    margin: 0 0 20px;
    color: var(--ax-color-text-muted);
    font-size: 0.74rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

ul {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px 44px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ax-color-text-secondary);
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
}

.logo img {
    display: block;
    width: auto;
    max-width: 150px;
    height: 44px;
    object-fit: contain;
    filter: grayscale(1) brightness(1.6);
    opacity: 0.75;
    transition: filter 0.2s ease, opacity 0.2s ease;
}

a.logo:hover img,
a.logo:focus-visible img {
    filter: none;
    opacity: 1;
}

.cert img {
    height: 52px;
    max-width: 90px;
}

a.logo:focus-visible {
    outline: 2px solid var(--ax-color-accent-red-soft);
    outline-offset: 4px;
    border-radius: 4px;
}
</style>
