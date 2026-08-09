<template>
    <section class="partners-section">
        <div class="partners-overlay">
            <h2 class="partners-title">{{ resolvedTitle }}</h2>
        </div>

        <div class="partners-grid">
            <a
                v-for="partner in resolvedPartners"
                :key="partner.name"
                class="partner-card"
                :href="partner.website || '#'"
                :target="partner.website ? '_blank' : undefined"
                :rel="partner.website ? 'noopener noreferrer' : undefined"
            >
                <img
                    v-if="partner.logo"
                    :src="partner.logo"
                    :alt="partner.name"
                    width="160"
                    height="56"
                    loading="lazy"
                    decoding="async"
                />
                <span v-else>{{ partner.name }}</span>
            </a>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

type PartnerItem = {
    name: string;
    logo?: string;
    website?: string;
};

const props = defineProps<{
    title?: string;
    partners?: PartnerItem[];
}>();

const defaultPartners: PartnerItem[] = [
    { name: "Angel", logo: "/immagini/Angel.png", website: "https://www.axatel.it" },
    // { name: "Smart River Guard", logo: "", website: "" },
    // { name: "Bridge Sentinel", logo: "", website: "" },
    // { name: "Traffic Pulse", logo: "", website: "" }
];

const resolvedTitle = computed(() => {
    const value = props.title?.trim();
    return value && value.length > 0 ? value : "I nostri partner";
});

const resolvedPartners = computed(() => {
    if (props.partners && props.partners.length > 0) {
        return props.partners;
    }

    return defaultPartners;
});
</script>

<style scoped>
.partners-section {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    padding: 14vh 8vw 10vh;
    background: transparent;
}

.partners-overlay {
    margin-bottom: 4vh;
}

.partners-title {
    margin: 0;
    color: var(--ax-color-text-primary);
    font-size: clamp(1.2rem, 2.1vw, 2rem);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 700;
    text-shadow: 0 8px 26px rgba(3, 14, 25, 0.6);
}

.partners-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 18px;
}

.partner-card {
    min-height: 106px;
    border-radius: var(--ax-card-radius);
    border: 1px solid var(--ax-color-border-soft);
    background: linear-gradient(180deg, rgba(246, 251, 255, 0.93), rgba(227, 240, 252, 0.9));
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: #173b62;
    box-shadow: 0 12px 30px rgba(9, 23, 40, 0.16);
}

.partner-card img {
    max-width: 70%;
    max-height: 56px;
    object-fit: contain;
}

.partner-card span {
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    font-size: 0.8rem;
    text-align: center;
    padding: 0 10px;
}

@media (max-width: 900px) {
    .partners-section {
        padding: 10vh 6vw 8vh;
    }

    .partners-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .partners-section {
        padding: 8vh 5vw 7vh;
    }

    .partners-grid {
        grid-template-columns: 1fr;
        gap: 12px;
    }

    .partner-card {
        min-height: 88px;
    }
}
</style>
