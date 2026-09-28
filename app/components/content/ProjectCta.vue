<template>
    <section class="project-cta" aria-labelledby="project-cta-title">
        <div>
            <h2 id="project-cta-title">{{ t("project.heading") }}</h2>
            <p>{{ t("project.text") }}</p>
        </div>
        <div class="actions">
            <NuxtLink :to="quoteLink" class="primary">{{ t("project.quote") }}</NuxtLink>
            <NuxtLink :to="localePath('/contatti')" class="secondary">{{ t("project.talk") }}</NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
// Closing call to action on solution and product pages. "Richiedi un
// preventivo" opens the contact form in quote mode with the subject filled in.
import { computed } from "vue";

const props = defineProps<{ subject?: string }>();
const { t } = useI18n();
const localePath = useLocalePath();

const quoteLink = computed(() => ({
    path: localePath("/contatti"),
    query: { tipo: "preventivo", ...(props.subject ? { oggetto: props.subject } : {}) },
}));
</script>

<style scoped>
.project-cta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 20px 32px;
    margin: 48px 0 0;
    padding: 30px 32px;
    border-radius: 18px;
    color: #f2f8ff;
    background:
        radial-gradient(circle at 100% 0%, rgba(234, 63, 48, 0.25), transparent 55%),
        linear-gradient(160deg, #0b1a2b 0%, #050d18 100%);
}

h2 {
    margin: 0 0 6px;
    color: #fff;
    font-size: clamp(1.3rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

p {
    margin: 0;
    max-width: 52ch;
    color: #c6dcef;
    line-height: 1.55;
}

.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.actions a {
    display: inline-flex;
    align-items: center;
    min-height: 46px;
    padding: 0 22px;
    border-radius: 999px;
    font-size: 0.86rem;
    font-weight: 650;
    text-decoration: none;
}

.primary {
    color: #fff;
    background: var(--ax-color-accent-red, #c52317);
}

.primary:hover {
    background: var(--ax-color-accent-red-soft, #ea3f30);
}

.secondary {
    color: #fff;
    border: 1px solid rgba(198, 220, 239, 0.35);
}

.secondary:hover {
    border-color: rgba(198, 220, 239, 0.75);
}

.actions a:focus-visible {
    outline: 2px solid #8bd9ff;
    outline-offset: 3px;
}
</style>
