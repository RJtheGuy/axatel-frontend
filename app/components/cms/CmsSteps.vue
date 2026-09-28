<template>
    <section class="cms-steps">
        <h2>{{ value.heading }}</h2>
        <ol>
            <li v-for="(step, index) in value.steps" :key="step.title">
                <span class="num" aria-hidden="true">{{ String(index + 1).padStart(2, "0") }}</span>
                <div>
                    <h3>{{ step.title }}</h3>
                    <p v-if="step.text">{{ step.text }}</p>
                </div>
            </li>
        </ol>
    </section>
</template>

<script setup lang="ts">
// "Come funziona": an ordered process (numbers are meaningful here).
defineProps<{ value: { heading: string; steps: Array<{ title: string; text?: string }> } }>();
</script>

<style scoped>
.cms-steps {
    max-width: var(--cms-measure, 760px);
    margin: 0 auto;
    padding: 28px 0;
    border-top: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
}

h2 {
    margin: 0 0 18px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

ol {
    display: grid;
    gap: 16px;
    margin: 0;
    padding: 0;
    list-style: none;
}

li {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 14px;
    align-items: start;
}

.num {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(234, 63, 48, 0.4);
    border-radius: 50%;
    color: var(--ax-color-accent-red-soft, #ea3f30);
    font-size: 0.8rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

h3 {
    margin: 6px 0 4px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: 1.05rem;
    font-weight: 600;
}

p {
    margin: 0;
    color: var(--cms-text, var(--ax-color-text-secondary));
    line-height: 1.6;
}
</style>
