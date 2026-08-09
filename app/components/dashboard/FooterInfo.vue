<template>
    <footer class="footer-section">
        <div class="footer-grid">
            <a
                v-for="item in resolvedContacts"
                :key="item.title"
                class="footer-contact"
                :href="item.href"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener noreferrer' : undefined"
            >
                <img
                    v-if="item.icon"
                    :src="item.icon"
                    :alt="item.title"
                    width="20"
                    height="20"
                    loading="lazy"
                    decoding="async"
                />
                <div>
                    <p class="contact-title">{{ item.title }}</p>
                    <p class="contact-value">{{ item.value }}</p>
                </div>
            </a>
        </div>

        <div class="footer-legal">
            <p>{{ resolvedVatLabel }} {{ resolvedVatValue }}</p>
            <p>{{ resolvedTaxLabel }} {{ resolvedTaxValue }}</p>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";

type FooterContact = {
    title: string;
    value: string;
    href: string;
    icon?: string;
    external?: boolean;
};

const props = defineProps<{
    contacts?: FooterContact[];
    vatLabel?: string;
    vatValue?: string;
    taxLabel?: string;
    taxValue?: string;
}>();

const defaultContacts: FooterContact[] = [
    {
        title: "Chiamaci",
        value: "+39 0444 963891",
        href: "tel:+390444963891"
    },
    {
        title: "Scrivici",
        value: "info@axatel.it",
        href: "mailto:info@axatel.it"
    },
    {
        title: "Seguici",
        value: "su Linkedin",
        href: "https://www.linkedin.com/company/axatel/",
        external: true
    },
    {
        title: "Vieni a trovarci",
        value: "Viale del Mercato Nuovo, 75, 36100, Vicenza (VI)",
        href: "https://www.google.com/maps/place/Viale+Mercato+Nuovo,+75,+36100+Vicenza+VI",
        external: true
    }
];

const resolvedContacts = computed(() => {
    if (props.contacts && props.contacts.length > 0) {
        return props.contacts;
    }

    return defaultContacts;
});

const resolvedVatLabel = computed(() => props.vatLabel?.trim() || "Partita IVA:");
const resolvedTaxLabel = computed(() => props.taxLabel?.trim() || "Codice Fiscale:");
const resolvedVatValue = computed(() => props.vatValue?.trim() || "00000000000");
const resolvedTaxValue = computed(() => props.taxValue?.trim() || "00000000000");
</script>

<style scoped>
.footer-section {
    width: 100vw;
    padding: 7vh 8vw 5vh;
    background: linear-gradient(180deg, rgba(7, 20, 33, 0.88), rgba(3, 10, 18, 0.95));
    border-top: 1px solid var(--ax-color-border-soft);
}

.footer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
}

.footer-contact {
    text-decoration: none;
    color: var(--ax-color-text-primary);
    border: 1px solid var(--ax-color-border-soft);
    padding: 14px;
    background: rgba(12, 29, 45, 0.45);
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.footer-contact img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    margin-top: 2px;
}

.contact-title {
    margin: 0;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ax-color-text-secondary);
}

.contact-value {
    margin: 5px 0 0;
    font-size: 0.95rem;
    line-height: 1.3;
    color: var(--ax-color-text-primary);
}

.footer-legal {
    margin-top: 22px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    color: var(--ax-color-text-muted);
    font-size: 0.84rem;
}

.footer-legal p {
    margin: 0;
}

@media (max-width: 768px) {
    .footer-section {
        padding: 5vh 5vw 4vh;
    }

    .footer-grid {
        grid-template-columns: 1fr;
    }

    .footer-contact {
        padding: 12px;
    }

    .contact-value {
        font-size: 0.88rem;
    }

    .footer-legal {
        margin-top: 16px;
        gap: 10px;
        font-size: 0.78rem;
    }
}
</style>
